// CHEMIN : src/pages/gestionnaire/BoutiqueAddons.tsx
// e-Vend Studio — Add-ons des templates boutique (solo), affichés dans « Mon plan & limites » (BoutiquePlan) :
// le catalogue (BoutiqueAddonsCatalogue) puis le récapitulatif de ce que le gestionnaire paiera vraiment (palier + add-ons activés).
// Seuls les add-ons qui fonctionnent vraiment dans la boutique sont offerts (le serveur les filtre).
// API : GET /api/boutique/gestionnaire/addons · POST /:code/activer · DELETE /:code. Ne sert JAMAIS au multivendeur.

import React, { useEffect, useState } from 'react';
import { bq, messageErreur } from './boutiqueApi';
import BoutiqueAddonsCatalogue, { ItemAddonBoutique } from './BoutiqueAddonsCatalogue';

interface Addon {
  code: string; nom: string; description: string; emoji: string; categorie: string; guide_url: string;
  prix_ht: number; achete: boolean; prix_facture: number; offert: boolean;
}
interface Categorie { id: string; nom: string; emoji: string; }
interface Etat { categories: Categorie[]; addons: Addon[]; total_ht: number; }

export interface PalierResume { label: string; prix: string; }
interface Props {
  couleur: string;
  palier: PalierResume | null;                                   // palier d'annonces actuel (null = template sans palier)
  onChange?: (actifs: Record<string, boolean>) => void;          // prévient le menu du gestionnaire : { code: true } pour chaque add-on activé et offert
}

const D = { carte: 'rgba(255,255,255,0.04)', bord: 'rgba(255,255,255,0.1)', texte: '#ffffff', texte2: 'rgba(255,255,255,0.78)', discret: 'rgba(255,255,255,0.5)' };
const $ = (n: number) => n.toFixed(2).replace('.', ',') + ' $';

// Le prix d'un palier vient de « Prix Template » sous forme de texte (« 29.99 », « 29,99 $ »…). null si ce n'est pas un nombre clair.
export function prixEnNombre(prix: string): number | null {
  const t = String(prix || '').replace(/\s/g, '').replace(/[$€]/g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

export default function BoutiqueAddons({ couleur, palier, onChange }: Props) {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [chargement, setChargement] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; texte: string } | null>(null);

  const notifier = (type: 'ok' | 'err', texte: string) => { setMsg({ type, texte }); setTimeout(() => setMsg(null), 4000); };

  const appliquer = (e: Etat) => {
    setEtat(e);
    if (onChange) {
      const m: Record<string, boolean> = {};
      e.addons.forEach(a => { if (a.achete && a.offert) m[a.code] = true; });
      onChange(m);
    }
  };

  const charger = async () => {
    const r = await bq('/addons');
    if (r.ok) appliquer(r.data as Etat); else notifier('err', messageErreur(r));
    setChargement(false);
  };
  useEffect(() => { charger(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const basculer = async (it: ItemAddonBoutique) => {
    setBusy(true);
    const r = it.achete
      ? await bq(`/addons/${encodeURIComponent(it.code)}`, { method: 'DELETE' })
      : await bq(`/addons/${encodeURIComponent(it.code)}/activer`, { method: 'POST' });
    setBusy(false);
    if (r.ok) { appliquer(r.data as Etat); notifier('ok', it.achete ? `${it.nom} désactivé.` : `${it.nom} activé !`); }
    else notifier('err', messageErreur(r));
  };

  if (chargement) return <div style={{ padding: '30px 0', textAlign: 'center', color: D.discret, fontSize: 13 }}>⏳ Chargement des add-ons…</div>;
  if (!etat) return msg ? <div style={{ textAlign: 'center', color: '#f87171', fontWeight: 700, margin: '20px 0' }}>❌ {msg.texte}</div> : null;

  const cats = etat.categories;
  const catDe = (id: string) => cats.find(c => c.id === id) || cats.find(c => c.id === 'autres') || cats[cats.length - 1];
  const rang = (id: string) => { const i = cats.findIndex(c => c.id === id); return i < 0 ? cats.length : i; };
  const items: ItemAddonBoutique[] = [...etat.addons]
    .sort((a, b) => rang(a.categorie) - rang(b.categorie))
    .map(a => ({
      code: a.code, nom: a.nom, description: a.description, emoji: a.emoji, prix: a.prix_ht,
      categorie_id: catDe(a.categorie).id, categorie_nom: catDe(a.categorie).nom, categorie_emoji: catDe(a.categorie).emoji,
      lien_documentation: a.guide_url || null, achete: a.achete, prix_facture: a.prix_facture,
    }));

  // Récapitulatif : ce que le gestionnaire paiera vraiment
  const actifs = etat.addons.filter(a => a.achete);
  const prixPalier = palier ? prixEnNombre(palier.prix) : null;
  const palierSansPrix = !!palier && prixPalier === null;
  const total = Math.round(((prixPalier || 0) + etat.total_ht) * 100) / 100;

  return (
    <div style={{ marginTop: 28 }}>
      <BoutiqueAddonsCatalogue items={items} busy={busy} couleur={couleur} onBasculer={basculer} />

      <div style={{ background: D.carte, border: `1px solid ${D.bord}`, borderRadius: 16, padding: '18px 24px', marginBottom: 20 }}>
        {palier && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: D.texte2, marginBottom: 6 }}>
            <span>Palier {palier.label}</span><strong>{prixPalier !== null ? $(prixPalier) : ((palier.prix || '').trim() || '—')}</strong>
          </div>
        )}
        {actifs.map(a => (
          <div key={a.code} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: D.texte2, marginBottom: 6 }}>
            <span>{a.emoji} {a.nom}</span><strong>{$(a.prix_facture)}</strong>
          </div>
        ))}
        {actifs.length === 0 && <div style={{ fontSize: 13, color: D.discret, marginBottom: 6 }}>Aucun add-on activé.</div>}
        <div style={{ borderTop: `1px solid ${D.bord}`, marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, color: D.texte }}>
          <span>Total mensuel</span><span>{$(total)} <span style={{ fontSize: 11, fontWeight: 500, color: D.discret }}>+ taxes</span></span>
        </div>
        {palierSansPrix && <div style={{ fontSize: 11, color: '#fcd34d', marginTop: 8 }}>Le prix du palier n'est pas un montant : il n'est pas inclus dans ce total.</div>}
      </div>

      {msg && <div style={{ textAlign: 'center', color: msg.type === 'ok' ? '#34d399' : '#f87171', fontWeight: 700, marginBottom: 16 }}>{msg.type === 'ok' ? '✅' : '❌'} {msg.texte}</div>}

      <p style={{ textAlign: 'center', fontSize: 12, color: D.discret, margin: 0 }}>
        Tous les prix sont en $ CAD + taxes applicables · Facturé mensuellement · Annulable en tout temps
      </p>
    </div>
  );
}