// CHEMIN : src/pages/gestionnaire/BoutiqueEtiquettes.tsx
// e-Vend Studio — Add-ons « Étiquettes Shippo / EasyPost / Postes Canada » (boutique solo) : contenu de l'onglet « Étiquettes d'expédition » de la Config générale.
// Le gestionnaire branche SON compte (clé API) ; UN SEUL transporteur actif à la fois. Les clés ne sont jamais renvoyées au navigateur (seulement « enregistrée »).
// API : GET /api/boutique/gestionnaire/etiquettes/config · PUT /etiquettes/shippo · PUT /etiquettes/easypost · PUT /etiquettes/postescanada

import React, { useState, useEffect, useCallback } from 'react';
import { bq, messageErreur } from './boutiqueApi';
import BoutiqueModale from './BoutiqueModale';

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', ok: '#16a34a', warn: '#b45309' };
interface Transp { code: 'shippo' | 'easypost' | 'postescanada'; nom: string; addon_actif: boolean; configure: boolean; mode: string; actif: boolean; webhook_url: string | null; cle_test?: boolean; cle_prod?: boolean; secret_configure?: boolean; numero_client?: string }
interface Etat { transporteurs: Transp[]; addon_actif: boolean; pret: boolean; actif: string | null; adresse_complete: boolean; adresse_manque: string[] }
const carte: React.CSSProperties = { background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 18, marginBottom: 16 };
const champ: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14 };

function Interrupteur({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={on} disabled={disabled} onClick={onClick}
      style={{ width: 48, height: 26, borderRadius: 13, border: 'none', background: on ? T.ok : '#d1d5db', position: 'relative', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, flexShrink: 0, padding: 0 }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }} />
    </button>
  );
}

export default function BoutiqueEtiquettes({ accent, isMobile, pagePlan, naviguerVers }: { gestionnaireId?: number; accent?: string; isMobile?: boolean; pagePlan?: string; naviguerVers?: (page: string) => void }) {
  const couleur = accent || '#2d6a9f';
  const [etat, setEtat] = useState<Etat | null>(null);
  const [guides, setGuides] = useState<Record<string, string>>({});
  const [tokenShippo, setTokenShippo] = useState('');
  const [cleEP, setCleEP] = useState(''); const [secretEP, setSecretEP] = useState('');
  const [cleP, setCleP] = useState(''); const [secretP, setSecretP] = useState(''); const [numeroP, setNumeroP] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [copie, setCopie] = useState('');
  const [modale, setModale] = useState<{ type: 'erreur' | 'succes' | 'confirmer'; message: string; action?: () => void } | null>(null);

  const charger = useCallback(async () => {
    const [r, a] = await Promise.all([bq('/etiquettes/config'), bq('/addons')]);
    if (r.ok) setEtat(r.data); else setModale({ type: 'erreur', message: messageErreur(r) });
    if (a.ok && a.data && Array.isArray(a.data.addons)) {
      const g: Record<string, string> = {};
      a.data.addons.forEach((y: any) => { const m: Record<string, string> = { etiquette_shippo: 'shippo', etiquette_easypost: 'easypost', etiquette_postescanada: 'postescanada' }; if (m[y.code] && y.guide_url) g[m[y.code]] = y.guide_url; });
      setGuides(g);
    }
  }, []);
  useEffect(() => { charger(); }, [charger]);

  const envoyer = async (code: 'shippo' | 'easypost' | 'postescanada', corps: any, succes: string) => {
    setOccupe(true);
    const r = await bq(`/etiquettes/${code}`, { method: 'PUT', body: corps });
    setOccupe(false);
    if (!r.ok) { setModale({ type: 'erreur', message: messageErreur(r) }); return; }
    setEtat(r.data); setTokenShippo(''); setCleEP(''); setSecretEP(''); setCleP(''); setSecretP(''); setNumeroP(''); setModale({ type: 'succes', message: succes });
  };
  const copier = async (code: string, url: string) => {
    try { await navigator.clipboard.writeText(url); setCopie(code); setTimeout(() => setCopie(''), 2000); }
    catch (e) { setModale({ type: 'erreur', message: "Copie impossible : sélectionnez l'adresse et copiez-la manuellement." }); }
  };

  if (!etat) return <div style={{ padding: 24, color: T.light }}>Chargement…</div>;
  const btn = (fort?: boolean, rouge?: boolean, bloque?: boolean): React.CSSProperties => ({ border: fort ? 'none' : `1px solid ${rouge ? '#fca5a5' : T.border}`, background: fort ? couleur : '#fff', color: fort ? '#fff' : rouge ? '#b91c1c' : '#374151', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: bloque || occupe ? 'not-allowed' : 'pointer', opacity: bloque ? 0.5 : 1 });
  const ligneMode = (mode: string) => (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 12, background: mode === 'production' ? '#e9f7ef' : '#fef9e7', color: mode === 'production' ? '#1e8449' : '#b7950b' }}>{mode === 'production' ? '🚀 Production' : '🧪 Test'}</span>
  );
  const verrou = (nom: string) => (
    <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', borderRadius: 10, padding: '10px 14px', fontSize: 13, margin: '12px 0 0' }}>
      🔒 L'add-on <strong>Étiquettes {nom}</strong> n'est pas activé : activez-le dans <strong>Mon plan &amp; limites</strong>.
      {pagePlan && naviguerVers && <button type="button" onClick={() => naviguerVers(pagePlan)} style={{ marginLeft: 10, border: '1px solid #fdba74', background: '#fff', color: '#9a3412', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Voir « Mon plan &amp; limites »</button>}
    </div>
  );
  const urlWebhook = (t: Transp) => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <input readOnly aria-label={`Adresse du webhook ${t.nom}`} style={{ ...champ, flex: 1, minWidth: 200, background: '#f9fafb' }} value={t.webhook_url || ''} onFocus={e => e.currentTarget.select()} />
      <button type="button" style={btn()} onClick={() => copier(t.code, t.webhook_url || '')}>{copie === t.code ? '✅ Copié' : '📋 Copier'}</button>
    </div>
  );
  const entete = (t: Transp, icone: string, sous: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 24 }}>{icone}</span>
      <div style={{ flex: 1, minWidth: 140 }}>
        <div style={{ fontSize: 16, fontWeight: 800, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {t.nom}
          {guides[t.code] && <a href={guides[t.code]} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: couleur, textDecoration: 'none', border: `1px solid ${couleur}`, borderRadius: 12, padding: '1px 9px' }}>📖 Guide</a>}
          {t.configure && ligneMode(t.mode)}
        </div>
        <div style={{ fontSize: 12, color: T.light }}>{sous}</div>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: t.actif ? T.ok : T.light }}>{t.actif ? '✅ Actif' : 'Inactif'}</span>
      <Interrupteur on={t.actif} disabled={!t.addon_actif || occupe || (!t.configure && !t.actif)} onClick={() => envoyer(t.code, { actif: !t.actif }, t.actif ? `${t.nom} désactivé (vos clés sont conservées).` : `${t.nom} activé : « Créer une étiquette » apparaît sur vos commandes payées. Les autres transporteurs sont désactivés.`)} />
    </div>
  );

  const shippo = etat.transporteurs.find(t => t.code === 'shippo');
  const easypost = etat.transporteurs.find(t => t.code === 'easypost');
  const postes = etat.transporteurs.find(t => t.code === 'postescanada');
  const pret3 = !!cleP.trim() || !!secretP.trim() || !!numeroP.trim();

  return (
    <div style={{ maxWidth: 760, color: T.text }}>
      <p style={{ margin: '0 0 14px', color: T.light, fontSize: 14, lineHeight: 1.5 }}>
        Achetez et imprimez vos étiquettes d'expédition depuis le détail d'une commande ; le numéro de suivi est ajouté et mis à jour automatiquement. Les étiquettes sont facturées sur <strong>votre</strong> compte chez le transporteur. <strong>Un seul transporteur peut être actif à la fois.</strong>
      </p>

      {shippo && (
        <div style={{ ...carte, borderColor: shippo.actif ? couleur : T.border, borderWidth: shippo.actif ? 2 : 1, opacity: shippo.addon_actif ? 1 : 0.8 }}>
          {entete(shippo, '🚢', 'Multi-transporteurs · une clé API')}
          {!shippo.addon_actif ? verrou('Shippo') : (
            <div style={{ marginTop: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Clé API Shippo</label>
              {shippo.configure && <div style={{ fontSize: 13, marginBottom: 8 }}>✅ Clé enregistrée (le mode se déduit de la clé)</div>}
              <input type="password" autoComplete="off" spellCheck={false} style={champ} placeholder={shippo.configure ? 'Coller une nouvelle clé pour la remplacer' : 'shippo_test_… ou shippo_live_…'} value={tokenShippo} onChange={e => setTokenShippo(e.target.value)} />
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                <button type="button" disabled={occupe || !tokenShippo.trim()} style={btn(true, false, !tokenShippo.trim())} onClick={() => envoyer('shippo', { token: tokenShippo, actif: true }, 'Clé Shippo enregistrée et activée. Les autres transporteurs sont désactivés.')}>{occupe ? '⏳…' : '✔ Enregistrer et activer'}</button>
                {shippo.configure && <button type="button" disabled={occupe} style={btn(false, true)} onClick={() => setModale({ type: 'confirmer', message: 'Retirer votre clé Shippo ? Vous ne pourrez plus créer d\'étiquettes avec Shippo.', action: () => envoyer('shippo', { effacer: true }, 'Clé Shippo retirée.') })}>Retirer la clé</button>}
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Suivi automatique (webhook)</div>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: T.light, lineHeight: 1.5 }}>Dans Shippo : <strong>Settings → API → Webhooks → Add webhook</strong>, événement <strong>Track updated</strong>, et collez cette adresse :</p>
                {urlWebhook(shippo)}
              </div>
            </div>
          )}
        </div>
      )}

      {easypost && (
        <div style={{ ...carte, borderColor: easypost.actif ? couleur : T.border, borderWidth: easypost.actif ? 2 : 1, opacity: easypost.addon_actif ? 1 : 0.8 }}>
          {entete(easypost, '📬', 'Multi-transporteurs · clés test et production')}
          {!easypost.addon_actif ? verrou('EasyPost') : (
            <div style={{ marginTop: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Clé API EasyPost</label>
              <div style={{ fontSize: 13, marginBottom: 8, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <span>{easypost.cle_test ? '✅' : '▫️'} Clé test (EZTK…)</span><span>{easypost.cle_prod ? '✅' : '▫️'} Clé production (EZAK…)</span>
              </div>
              <input type="password" autoComplete="off" spellCheck={false} style={champ} placeholder="Coller une clé EZTK… (test) ou EZAK… (production)" value={cleEP} onChange={e => setCleEP(e.target.value)} />
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                <button type="button" disabled={occupe || !cleEP.trim()} style={btn(true, false, !cleEP.trim())} onClick={() => envoyer('easypost', { cle: cleEP, actif: true }, 'Clé EasyPost enregistrée et activée. Les autres transporteurs sont désactivés.')}>{occupe ? '⏳…' : '✔ Enregistrer et activer'}</button>
                {easypost.configure && <button type="button" disabled={occupe} style={btn(false, true)} onClick={() => setModale({ type: 'confirmer', message: 'Retirer toutes vos clés EasyPost et votre secret webhook ?', action: () => envoyer('easypost', { effacer: true }, 'Vos clés EasyPost et votre secret webhook ont été supprimés.') })}>Retirer les clés</button>}
              </div>
              {easypost.configure && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Mode utilisé pour les étiquettes</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {([['test', '🧪 Test', !!easypost.cle_test], ['production', '🚀 Production', !!easypost.cle_prod]] as const).map(([m, lib, dispo]) => (
                      <button key={m} type="button" disabled={occupe || !dispo} onClick={() => envoyer('easypost', { mode: m }, m === 'production' ? 'Mode production : les étiquettes sont réelles et facturées.' : 'Mode test : les étiquettes sont fictives.')}
                        style={{ padding: '7px 14px', borderRadius: 16, border: `2px solid ${easypost.mode === m ? couleur : T.border}`, background: easypost.mode === m ? '#f0f5fb' : '#fff', fontWeight: 700, fontSize: 12, cursor: dispo ? 'pointer' : 'not-allowed', opacity: dispo ? 1 : 0.45 }}>{lib}</button>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Suivi automatique (webhook signé)</div>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: T.light, lineHeight: 1.5 }}>Dans <strong>votre</strong> compte EasyPost : <strong>Webhooks &amp; Events → Add webhook</strong> avec cette adresse. EasyPost vous donne un <strong>secret webhook</strong> : collez-le plus bas.</p>
                {urlWebhook(easypost)}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 6px', flexWrap: 'wrap' }}>
                  <label style={{ fontSize: 13, fontWeight: 700 }}>Secret webhook EasyPost</label>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 12, background: easypost.secret_configure ? '#e9f7ef' : '#fef9e7', color: easypost.secret_configure ? '#1e8449' : '#b7950b' }}>{easypost.secret_configure ? '✅ Enregistré' : '⚠️ Non enregistré'}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input type="password" autoComplete="off" spellCheck={false} maxLength={200} style={{ ...champ, flex: 1, minWidth: 200 }} placeholder={easypost.secret_configure ? 'Coller un nouveau secret pour le remplacer' : 'Collez le secret webhook obtenu chez EasyPost'} value={secretEP} onChange={e => setSecretEP(e.target.value)} />
                  <button type="button" disabled={occupe || !secretEP.trim() || !easypost.configure} style={btn(true, false, !secretEP.trim() || !easypost.configure)} onClick={() => envoyer('easypost', { secret: secretEP }, 'Secret webhook enregistré : le suivi automatique est actif.')}>Enregistrer le secret</button>
                  {easypost.secret_configure && <button type="button" disabled={occupe} style={btn(false, true)} onClick={() => envoyer('easypost', { effacer_secret: true }, 'Secret webhook retiré : le suivi automatique est désactivé.')}>Retirer</button>}
                </div>
                <p style={{ margin: '8px 0 0', fontSize: 12, color: T.light, lineHeight: 1.5 }}>🔒 Chaque mise à jour reçue est vérifiée avec ce secret, pour empêcher un faux statut « livrée ». <strong>Sans secret, le suivi automatique est ignoré</strong> (l'achat d'étiquette fonctionne quand même).{!easypost.configure && ' Enregistrez d\'abord votre clé API.'}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {postes && (
        <div style={{ ...carte, borderColor: postes.actif ? couleur : T.border, borderWidth: postes.actif ? 2 : 1, opacity: postes.addon_actif ? 1 : 0.8 }}>
          {entete(postes, '🍁', 'Directement avec Postes Canada · Canada seulement')}
          {!postes.addon_actif ? verrou('Postes Canada') : (
            <div style={{ marginTop: 14 }}>
              <p style={{ margin: '0 0 10px', fontSize: 12, color: T.light, lineHeight: 1.5 }}>Dans le <strong>Portail des développeurs de Postes Canada</strong>, créez une application pour obtenir votre <strong>clé API</strong> et votre <strong>code secret API</strong> ; votre <strong>numéro de client</strong> est affiché en haut de votre tableau de bord « Solutions pour petites entreprises ».</p>
              <div style={{ fontSize: 13, marginBottom: 8, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <span>{postes.configure ? '✅ Identifiants enregistrés' : '▫️ Identifiants à saisir'}</span>
                {postes.numero_client ? <span>Numéro de client : <strong>{postes.numero_client}</strong></span> : null}
              </div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, margin: '10px 0 6px' }}>Clé API</label>
              <input type="password" autoComplete="off" spellCheck={false} maxLength={200} style={champ} placeholder={postes.configure ? 'Coller une nouvelle clé pour la remplacer' : 'Clé API Postes Canada'} value={cleP} onChange={e => setCleP(e.target.value)} />
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, margin: '10px 0 6px' }}>Code secret API</label>
              <input type="password" autoComplete="off" spellCheck={false} maxLength={200} style={champ} placeholder={postes.configure ? 'Coller un nouveau code pour le remplacer' : 'Code secret API Postes Canada'} value={secretP} onChange={e => setSecretP(e.target.value)} />
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, margin: '10px 0 6px' }}>Numéro de client</label>
              <input inputMode="numeric" autoComplete="off" maxLength={12} style={champ} placeholder={postes.numero_client ? `Actuel : ${postes.numero_client}` : 'Ex. 0009999999'} value={numeroP} onChange={e => setNumeroP(e.target.value.replace(/\D/g, ''))} />
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                <button type="button" disabled={occupe || !pret3} style={btn(true, false, !pret3)} onClick={() => envoyer('postescanada', { cle: cleP, secret: secretP, numero_client: numeroP, actif: true }, 'Identifiants Postes Canada enregistrés et activés. Les autres transporteurs sont désactivés.')}>Enregistrer et activer</button>
                {postes.configure && <button type="button" disabled={occupe} style={btn(false, true)} onClick={() => setModale({ type: 'confirmer', message: 'Retirer vos identifiants Postes Canada ? Vous ne pourrez plus créer d\'étiquettes avec Postes Canada.', action: () => envoyer('postescanada', { effacer: true }, 'Identifiants Postes Canada retirés.') })}>Retirer</button>}
              </div>
              {postes.configure && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Mode (repère)</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {([['test', '🧪 Test'], ['production', '🚀 Production']] as const).map(([m, lib]) => (
                      <button key={m} type="button" disabled={occupe} onClick={() => envoyer('postescanada', { mode: m }, m === 'production' ? 'Mode production noté.' : 'Mode test noté.')}
                        style={{ padding: '7px 14px', borderRadius: 16, border: `2px solid ${postes.mode === m ? couleur : T.border}`, background: postes.mode === m ? '#f0f5fb' : '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>{lib}</button>
                    ))}
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: T.light, lineHeight: 1.5 }}>Ce sélecteur est un simple repère : les étiquettes sont toujours créées avec les identifiants ci-dessus, selon ce que votre compte Postes Canada permet (test ou production).</p>
                </div>
              )}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>À savoir</div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: T.light, lineHeight: 1.7 }}>
                  <li>Une <strong>carte de crédit</strong> doit être enregistrée et définie par défaut dans votre profil Postes Canada : c'est elle qui est facturée.</li>
                  <li>Livraisons <strong>au Canada seulement</strong> (pour l'international, utilisez Shippo ou EasyPost).</li>
                  <li>Aucun webhook : le suivi est vérifié automatiquement environ aux 30 minutes. Seuls « Colis reçu » et « Livré » sont reconnus pour l'instant ; les autres événements s'ajoutent à l'historique sans changer l'étape.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ ...carte, background: '#f9fafb' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>Bon à savoir</h3>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: T.light, lineHeight: 1.7 }}>
          <li>Activer un transporteur désactive l'autre ; vos clés restent enregistrées. Le suivi automatique des étiquettes déjà achetées chez l'ancien transporteur s'arrête.</li>
          <li>L'adresse d'expédition est celle de votre boutique (votre profil).{!etat.adresse_complete && <strong style={{ color: T.warn }}> Elle est incomplète ({etat.adresse_manque.join(', ')}) : complétez-la avant de créer une étiquette.</strong>}</li>
          <li>Le poids est calculé d'après la fiche de vos produits ; sinon vous l'entrez à la main.</li>
          <li>Un achat d'étiquette demande toujours une confirmation avec le prix.</li>
          <li><strong>Pour annuler ou faire rembourser une étiquette achetée par erreur, passez par le tableau de bord de votre transporteur</strong> (impossible depuis l'application).</li>
        </ul>
      </div>

      {modale && (modale.type === 'confirmer'
        ? <BoutiqueModale type="confirmer" accent={couleur} message={modale.message} texteConfirmer="Oui, retirer" texteFermer="Non" enCours={occupe} onFermer={() => setModale(null)} onConfirmer={() => { const a = modale.action; setModale(null); if (a) a(); }} />
        : <BoutiqueModale type={modale.type} accent={couleur} message={modale.message} onFermer={() => setModale(null)} />)}
    </div>
  );
}