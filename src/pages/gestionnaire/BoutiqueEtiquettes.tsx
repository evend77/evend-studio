// CHEMIN : src/pages/gestionnaire/BoutiqueEtiquettes.tsx
// e-Vend Studio — Add-on « Étiquettes Shippo » (boutique solo) : le gestionnaire branche SON compte Shippo (clé API), puis crée ses étiquettes depuis le détail d'une commande.
// API : /api/boutique/gestionnaire/etiquettes/config (GET) et /shippo (PUT). La clé n'est jamais renvoyée au navigateur.

import React, { useState, useEffect, useCallback } from 'react';
import { bq, messageErreur } from './boutiqueApi';
import BoutiqueModale from './BoutiqueModale';

const T = { accent: '#2d6a9f', border: '#e1e4e8', text: '#1a2332', light: '#6b7280', danger: '#dc2626', success: '#16a34a' };
interface Etat { addon_actif: boolean; configure: boolean; actif: boolean; pret: boolean; mode: string; webhook_url: string; adresse_complete: boolean; adresse_manque: string[] }
const carte: React.CSSProperties = { background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 16 };
const champ: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14 };

export default function BoutiqueEtiquettes({ accent, pagePlan, naviguerVers }: { gestionnaireId?: number; accent?: string; isMobile?: boolean; pagePlan?: string; naviguerVers?: (page: string) => void }) {
  const couleur = accent || T.accent;
  const [etat, setEtat] = useState<Etat | null>(null);
  const [guide, setGuide] = useState('');
  const [token, setToken] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [copie, setCopie] = useState(false);
  const [modale, setModale] = useState<{ type: 'erreur' | 'succes' | 'confirmer'; message: string } | null>(null);

  const charger = useCallback(async () => {
    const [r, a] = await Promise.all([bq('/etiquettes/config'), bq('/addons')]);
    if (r.ok) setEtat(r.data); else setModale({ type: 'erreur', message: messageErreur(r) });
    if (a.ok && a.data && Array.isArray(a.data.addons)) { const g = a.data.addons.find((y: any) => y.code === 'etiquette_shippo'); if (g && g.guide_url) setGuide(g.guide_url); }
  }, []);
  useEffect(() => { charger(); }, [charger]);

  const enregistrer = async (corps: any, succes: string) => {
    setOccupe(true);
    const r = await bq('/etiquettes/shippo', { method: 'PUT', body: corps });
    setOccupe(false);
    if (!r.ok) { setModale({ type: 'erreur', message: messageErreur(r) }); return; }
    setEtat(r.data); setToken(''); setModale({ type: 'succes', message: succes });
  };

  const copier = async () => {
    if (!etat) return;
    try { await navigator.clipboard.writeText(etat.webhook_url); setCopie(true); setTimeout(() => setCopie(false), 2000); }
    catch (e) { setModale({ type: 'erreur', message: 'Copie impossible : sélectionnez l\'adresse et copiez-la manuellement.' }); }
  };

  if (!etat) return <div style={{ padding: 24, color: T.light }}>Chargement…</div>;
  const bloque = !etat.addon_actif;
  const btn = (fort?: boolean, rouge?: boolean): React.CSSProperties => ({ border: fort ? 'none' : `1px solid ${rouge ? '#fca5a5' : T.border}`, background: fort ? couleur : '#fff', color: fort ? '#fff' : rouge ? '#b91c1c' : '#374151', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: bloque || occupe ? 'not-allowed' : 'pointer', opacity: bloque ? 0.5 : 1 });

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: 20, color: T.text }}>
      <h2 style={{ margin: '0 0 6px' }}>🏷️ Étiquettes d'expédition (Shippo) {guide && <a href={guide} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: couleur, textDecoration: 'none', border: `1px solid ${couleur}`, borderRadius: 12, padding: '2px 10px', marginLeft: 10, verticalAlign: 'middle' }}>📖 Guide</a>}</h2>
      <p style={{ margin: '0 0 18px', color: T.light, fontSize: 14, lineHeight: 1.5 }}>
        Achetez et imprimez vos étiquettes d'expédition directement depuis le détail d'une commande. Le numéro de suivi est ajouté à la commande et mis à jour automatiquement jusqu'à la livraison.
      </p>

      {bloque && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', borderRadius: 10, padding: '12px 16px', fontSize: 13, marginBottom: 16 }}>
          🔒 L'add-on <strong>Étiquettes Shippo</strong> n'est pas activé : vous pouvez regarder les réglages, mais l'enregistrement est désactivé. Activez-le dans <strong>Mon plan &amp; limites</strong>.
          {pagePlan && naviguerVers && <button type="button" onClick={() => naviguerVers(pagePlan)} style={{ marginLeft: 10, border: '1px solid #fdba74', background: '#fff', color: '#9a3412', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Voir « Mon plan &amp; limites »</button>}
        </div>
      )}

      <div style={carte}>
        <h3 style={{ margin: '0 0 10px', fontSize: 16 }}>1. Votre clé API Shippo</h3>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: T.light, lineHeight: 1.5 }}>
          Les étiquettes sont facturées sur <strong>votre</strong> compte Shippo. Collez votre clé API (elle commence par <code>shippo_test_</code> ou <code>shippo_live_</code>). Elle est chiffrée et ne s'affiche plus ensuite.
        </p>
        {etat.configure && (
          <div style={{ marginBottom: 12, fontSize: 13 }}>
            ✅ Clé enregistrée — mode <strong>{etat.mode === 'production' ? 'production (étiquettes réelles)' : 'test (étiquettes fictives)'}</strong>
          </div>
        )}
        <input type="password" autoComplete="off" style={{ ...champ, marginBottom: 10 }} placeholder={etat.configure ? 'Coller une nouvelle clé pour la remplacer' : 'shippo_test_… ou shippo_live_…'} value={token} onChange={e => setToken(e.target.value)} disabled={bloque} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" disabled={bloque || occupe || !token.trim()} style={{ ...btn(true), opacity: bloque || !token.trim() ? 0.5 : 1 }} onClick={() => enregistrer({ token, actif: true }, 'Clé Shippo enregistrée et activée.')}>{occupe ? '⏳…' : 'Enregistrer la clé'}</button>
          {etat.configure && <button type="button" disabled={bloque || occupe} style={btn(false, true)} onClick={() => setModale({ type: 'confirmer', message: 'Retirer votre clé Shippo ? Vous ne pourrez plus créer d\'étiquettes tant qu\'une nouvelle clé n\'est pas enregistrée.' })}>Retirer la clé</button>}
        </div>
      </div>

      {etat.configure && (
        <div style={carte}>
          <h3 style={{ margin: '0 0 10px', fontSize: 16 }}>2. Activation</h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 700, cursor: bloque ? 'not-allowed' : 'pointer' }}>
            <input type="checkbox" checked={etat.actif} disabled={bloque || occupe} style={{ width: 18, height: 18 }} onChange={e => enregistrer({ actif: e.target.checked }, e.target.checked ? 'Étiquettes activées.' : 'Étiquettes désactivées (votre clé est conservée).')} />
            Proposer « Créer une étiquette » dans mes commandes
          </label>
        </div>
      )}

      <div style={carte}>
        <h3 style={{ margin: '0 0 10px', fontSize: 16 }}>3. Suivi automatique (webhook)</h3>
        <p style={{ margin: '0 0 10px', fontSize: 13, color: T.light, lineHeight: 1.5 }}>
          Pour que le suivi se mette à jour tout seul, dans Shippo : <strong>Settings → API → Webhooks → Add webhook</strong>, événement <strong>Track updated</strong>, et collez cette adresse :
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input readOnly style={{ ...champ, flex: 1, minWidth: 220, background: '#f9fafb' }} value={etat.webhook_url} onFocus={e => e.currentTarget.select()} />
          <button type="button" style={{ ...btn(), opacity: 1, cursor: 'pointer' }} onClick={copier}>{copie ? '✅ Copié' : '📋 Copier'}</button>
        </div>
      </div>

      <div style={carte}>
        <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Bon à savoir</h3>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: T.light, lineHeight: 1.7 }}>
          <li>L'adresse d'expédition est l'adresse de votre boutique (votre profil).{!etat.adresse_complete && <strong style={{ color: '#b45309' }}> Elle est incomplète ({etat.adresse_manque.join(', ')}) : complétez-la avant de créer une étiquette.</strong>}</li>
          <li>Le poids est calculé d'après la fiche de vos produits ; sinon vous l'entrez à la main.</li>
          <li>Un achat d'étiquette demande toujours une confirmation avec le prix.</li>
          <li><strong>Pour annuler ou faire rembourser une étiquette achetée par erreur, passez par votre tableau de bord Shippo</strong> (ce n'est pas possible depuis l'application).</li>
        </ul>
      </div>

      {modale && (modale.type === 'confirmer'
        ? <BoutiqueModale type="confirmer" accent={couleur} message={modale.message} texteConfirmer="Oui, retirer" texteFermer="Non" enCours={occupe} onFermer={() => setModale(null)} onConfirmer={async () => { setModale(null); await enregistrer({ effacer: true }, 'Clé Shippo retirée.'); }} />
        : <BoutiqueModale type={modale.type} accent={couleur} message={modale.message} onFermer={() => setModale(null)} />)}
    </div>
  );
}