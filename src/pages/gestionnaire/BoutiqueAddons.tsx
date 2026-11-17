// CHEMIN : src/pages/gestionnaire/BoutiqueAddons.tsx
// e-Vend Studio — Add-ons des templates boutique (solo), affichés en bas de « Mon plan & limites » (BoutiquePlan).
// Seuls les add-ons qui fonctionnent vraiment dans la boutique sont offerts (le serveur les filtre).
// API : GET /api/boutique/gestionnaire/addons · POST /:code/activer · DELETE /:code. Ne sert JAMAIS au multivendeur.

import React, { useEffect, useState } from 'react';
import { bq, messageErreur } from './boutiqueApi';
import BoutiqueModale from './BoutiqueModale';

interface Addon {
  code: string; nom: string; description: string; emoji: string; categorie: string; guide_url: string;
  prix_ht: number; achete: boolean; prix_facture: number; offert: boolean;
}
interface Categorie { id: string; nom: string; emoji: string; }
interface Etat { categories: Categorie[]; addons: Addon[]; total_ht: number; }

const $ = (n: number) => n.toFixed(2).replace('.', ',') + ' $';

export default function BoutiqueAddons({ accent }: { accent: string }) {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [chargement, setChargement] = useState(true);
  const [cible, setCible] = useState<Addon | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');

  const charger = async () => {
    const r = await bq('/addons');
    if (r.ok) setEtat(r.data as Etat); else setErreur(messageErreur(r));
    setChargement(false);
  };
  useEffect(() => { charger(); }, []);

  const confirmer = async () => {
    if (!cible) return;
    setEnCours(true);
    const r = cible.achete ? await bq(`/addons/${encodeURIComponent(cible.code)}`, { method: 'DELETE' }) : await bq(`/addons/${encodeURIComponent(cible.code)}/activer`, { method: 'POST' });
    setEnCours(false);
    const nom = cible.nom;
    const etaitAchete = cible.achete;
    setCible(null);
    if (r.ok) { setEtat(r.data as Etat); setSucces(etaitAchete ? `« ${nom} » est désactivé.` : `« ${nom} » est activé.`); }
    else setErreur(messageErreur(r));
  };

  if (chargement) return <div style={{ padding: '30px 0', textAlign: 'center', color: '#888', fontSize: 13 }}>⏳ Chargement des add-ons…</div>;
  if (!etat) return erreur ? <BoutiqueModale type="erreur" message={erreur} onFermer={() => setErreur('')} /> : null;

  const vides = etat.addons.length === 0;
  const sections = etat.categories
    .map(c => ({ c, liste: etat.addons.filter(a => a.categorie === c.id) }))
    .filter(s => s.liste.length > 0);

  return (
    <div style={{ marginTop: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🧩</div>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Add-ons</h2>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Ajoutez des fonctionnalités à votre boutique. Activez ou désactivez-les quand vous voulez.</p>
        </div>
      </div>

      {vides && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '26px 20px', marginTop: 16, textAlign: 'center', color: '#666', fontSize: 14 }}>
          Aucun add-on n'est offert pour le moment. Ils apparaîtront ici dès qu'ils seront disponibles pour votre boutique.
        </div>
      )}

      {sections.map(({ c, liste }) => (
        <div key={c.id} style={{ marginTop: 22 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#374151', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.emoji} {c.nom}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {liste.map(a => (
              <div key={a.code} style={{ background: '#fff', border: `2px solid ${a.achete ? accent : '#e5e7eb'}`, borderRadius: 12, padding: '16px 16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ fontSize: 26, lineHeight: 1 }}>{a.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#1a1a1a', overflowWrap: 'anywhere' }}>{a.nom}</div>
                    <div style={{ fontSize: 13, color: '#4b5563', fontWeight: 700 }}>{$(a.achete ? a.prix_facture : a.prix_ht)}<span style={{ fontWeight: 500, color: '#888' }}>/mois</span></div>
                  </div>
                  {a.achete && <span style={{ fontSize: 10, fontWeight: 800, background: accent, color: '#fff', padding: '3px 9px', borderRadius: 20 }}>ACTIF</span>}
                </div>
                {a.description && <div style={{ fontSize: 12.5, color: '#6b7280', lineHeight: 1.5 }}>{a.description}</div>}
                {a.guide_url && <a href={a.guide_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: accent, fontWeight: 700 }}>📖 Guide</a>}
                <div style={{ marginTop: 'auto' }}>
                  {a.achete ? (
                    <button onClick={() => setCible(a)} style={{ width: '100%', padding: '9px', border: '1px solid #e5e7eb', borderRadius: 9, background: '#fff', color: '#b91c1c', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Désactiver</button>
                  ) : a.offert ? (
                    <button onClick={() => setCible(a)} style={{ width: '100%', padding: '9px', border: 'none', borderRadius: 9, background: accent, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Activer — {$(a.prix_ht)}/mois</button>
                  ) : (
                    <div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', padding: '9px 0' }}>Plus offert</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {!vides && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px', marginTop: 26, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>Total des add-ons activés</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a' }}>{$(etat.total_ht)} <span style={{ fontSize: 11, fontWeight: 500, color: '#888' }}>/mois + taxes</span></span>
        </div>
      )}
      {!vides && <p style={{ fontSize: 12, color: '#888', textAlign: 'center', marginTop: 10 }}>Prix en $ CAD + taxes applicables · Annulable en tout temps.</p>}

      {cible && (
        <BoutiqueModale type="confirmer" accent={accent} enCours={enCours}
          titre={cible.achete ? 'Désactiver cet add-on ?' : 'Activer cet add-on ?'}
          message={cible.achete
            ? `« ${cible.nom} » sera désactivé sur votre boutique. Vous pourrez le réactiver quand vous voulez.`
            : `« ${cible.nom} » sera activé sur votre boutique au prix de ${$(cible.prix_ht)}/mois + taxes.`}
          texteConfirmer={cible.achete ? 'Désactiver' : 'Activer'} onConfirmer={confirmer} onFermer={() => { if (!enCours) setCible(null); }} />
      )}
      {erreur && <BoutiqueModale type="erreur" message={erreur} onFermer={() => setErreur('')} />}
      {succes && <BoutiqueModale type="succes" accent={accent} message={succes} onFermer={() => setSucces('')} />}
    </div>
  );
}