// CHEMIN : src/pages/collaborateur/CollaborateurEtiquettes.tsx
// e-Vend Studio — Dashboard collaborateur : configuration des étiquettes d'expédition (add-ons « Étiquettes Shippo », « EasyPost » et « Postes Canada »).
// Adapté de ConfigurationGenerale.tsx (e-Vend, section Expédition). Chaque collaborateur colle SES PROPRES identifiants (Shippo, EasyPost ou Postes Canada) :
// elle est chiffrée côté serveur et n'est jamais renvoyée au navigateur. Un seul transporteur actif à la fois.
// API : /api/collab/:gestionnaireId/etiquettes/config · PUT /etiquettes/shippo · PUT /etiquettes/easypost · PUT /etiquettes/postescanada

import React, { useState, useEffect, useCallback } from 'react';

interface Transporteur { code: string; nom: string; addon_actif: boolean; configure: boolean; mode: string; actif: boolean; secret_configure?: boolean; numero_client?: string }
interface Props { gestionnaireId: number; accent: string; isMobile: boolean; naviguer?: (page: string) => void }

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', danger: '#dc2626', ok: '#1E8449' };
const URL_WEBHOOK = 'https://e-vendstudio.ca/api/webhooks-etiquettes/shippo';
const URL_WEBHOOK_EP = 'https://e-vendstudio.ca/api/webhooks-etiquettes/easypost';
const URL_GUIDE = 'https://e-vendstudio.ca/documents/mv-guide-des-etiquettes-shippo-add-on';
const URL_GUIDE_EP = 'https://e-vendstudio.ca/documents/mv-guide-etiquettes-easypost-add-on';
const URL_GUIDE_PC = 'https://e-vendstudio.ca/documents/mv-guide-etiquettes-postes-canada-add-on';
type Code = 'shippo' | 'easypost' | 'postescanada';

export default function CollaborateurEtiquettes({ gestionnaireId, accent, isMobile, naviguer }: Props) {
  const base = `/api/collab/${gestionnaireId}/etiquettes`;
  const [liste, setListe] = useState<Transporteur[] | null>(null);
  const [cle, setCle] = useState('');
  const [cleEP, setCleEP] = useState(''); const [secretEP, setSecretEP] = useState('');
  const [clePC, setClePC] = useState(''); const [secretPC, setSecretPC] = useState(''); const [numeroPC, setNumeroPC] = useState(''); const [modePC, setModePC] = useState<'test' | 'production'>('test');
  const [occupe, setOccupe] = useState(false);
  const [choisi, setChoisi] = useState<string | null | undefined>(undefined);   // undefined = suit l'état du serveur
  const [erreur, setErreur] = useState(''); const [info, setInfo] = useState('');
  const [copie, setCopie] = useState(false); const [copieEP, setCopieEP] = useState(false);

  const charger = useCallback(async () => {
    try {
      const res = await fetch(`${base}/config`, { credentials: 'include' });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setListe(j.transporteurs || []); setErreur('');
        const pc = (j.transporteurs || []).find((t: Transporteur) => t.code === 'postescanada');
        if (pc) { setNumeroPC(pc.numero_client || ''); setModePC(pc.mode === 'production' ? 'production' : 'test'); }
      } else setErreur(j.error || 'Chargement impossible');
    } catch { setErreur('Erreur réseau'); }
  }, [base]);
  useEffect(() => { charger(); }, [charger]);

  const envoyer = async (corps: object, message: string, code: Code = 'shippo') => {
    setOccupe(true); setErreur(''); setInfo('');
    try {
      const res = await fetch(`${base}/${code}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });
      const j = await res.json().catch(() => ({}));
      if (res.ok) { setListe(j.transporteurs || []); setCle(''); setCleEP(''); setSecretEP(''); setClePC(''); setSecretPC(''); setInfo(message); } else setErreur(j.error || 'Action impossible');
    } catch { setErreur('Erreur réseau'); }
    setOccupe(false);
  };

  const copier = async () => {
    try { await navigator.clipboard.writeText(URL_WEBHOOK); setCopie(true); setTimeout(() => setCopie(false), 2000); } catch { /* le champ reste sélectionnable à la main */ }
  };

  const copierEP = async () => {
    try { await navigator.clipboard.writeText(URL_WEBHOOK_EP); setCopieEP(true); setTimeout(() => setCopieEP(false), 2000); } catch { /* le champ reste sélectionnable à la main */ }
  };

  const shippo = (liste || []).find(t => t.code === 'shippo');
  const easypost = (liste || []).find(t => t.code === 'easypost');
  const postes = (liste || []).find(t => t.code === 'postescanada');
  // Un seul interrupteur allumé à la fois : celui du fournisseur « choisi » (sinon celui qui est actif côté serveur)
  const ouvert = (code: string) => (choisi !== undefined ? choisi === code : !!(liste || []).find(t => t.code === code && t.actif));
  const basculer = async (t: Transporteur) => {
    if (occupe) return;
    if (ouvert(t.code)) {                                   // on l'éteint
      if (t.actif) { await envoyer({ actif: false }, `${t.nom} est désactivé.`, t.code as Code); setChoisi(undefined); } else setChoisi(null);
    } else {                                                // on l'allume (éteint automatiquement l'autre)
      setChoisi(t.code);
      if (t.configure) { await envoyer({ actif: true }, `${t.nom} est activé : le bouton « Créer une étiquette » apparaît sur vos commandes payées.`, t.code as Code); setChoisi(undefined); }
    }
  };
  const Interrupteur = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
    <button type="button" role="switch" aria-checked={on} onClick={onClick} disabled={occupe}
      style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: on ? accent : '#d1d5db', position: 'relative', cursor: occupe ? 'default' : 'pointer', flexShrink: 0, padding: 0, opacity: occupe ? 0.6 : 1 }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .15s', boxShadow: '0 1px 3px rgba(0,0,0,.25)' }} />
    </button>
  );
  const carte: React.CSSProperties = { background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? 14 : 20, marginBottom: 14 };
  const champ: React.CSSProperties = { border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'monospace' };
  const btn = (plein: boolean, danger = false): React.CSSProperties => ({
    padding: '10px 16px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: occupe ? 'default' : 'pointer', opacity: occupe ? 0.6 : 1,
    border: plein ? 'none' : `1px solid ${danger ? T.danger : T.border}`, background: plein ? (danger ? T.danger : accent) : '#fff', color: plein ? '#fff' : (danger ? T.danger : T.text),
  });

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: T.text }}>🏷️ Étiquettes d'expédition</h2>
        {shippo?.addon_actif && <a href={URL_GUIDE} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 700, color: accent, textDecoration: 'none', border: `1px solid ${accent}`, borderRadius: 8, padding: '7px 12px' }}>📖 Guide Shippo</a>}
      </div>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: T.light, lineHeight: 1.6 }}>
        Achetez vos étiquettes directement depuis une commande, avec les tarifs réels des transporteurs, et suivez la livraison automatiquement.
        Vous utilisez <strong>votre propre compte</strong> chez le fournisseur : les étiquettes sont facturées à votre compte, et l'expédition part de l'adresse de votre boutique. Un seul fournisseur peut être actif à la fois : allumez l'interrupteur de celui que vous voulez utiliser.
      </p>

      {erreur && <div style={{ background: '#FDECEA', color: '#C0392B', padding: '9px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{erreur}</div>}
      {info && <div style={{ background: '#E9F7EF', color: T.ok, padding: '9px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{info}</div>}
      {!liste && !erreur && <div style={{ padding: 30, textAlign: 'center', color: T.light }}>Chargement…</div>}

      {!shippo?.addon_actif && !easypost?.addon_actif && !postes?.addon_actif && liste && (
        <div style={{ ...carte, background: '#FEF9E7', borderColor: '#F1C40F' }}>
          <p style={{ margin: 0, fontSize: 13, color: '#7d6608' }}>🔒 Aucune option d'étiquettes d'expédition n'est activée pour cette marketplace. Demandez au gestionnaire de l'activer.</p>
        </div>
      )}

      {shippo && shippo.addon_actif && (
        <>
          <div style={carte}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <strong style={{ fontSize: 15, color: T.text }}>🚚 Shippo</strong>
              <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {shippo.configure && <span style={{ background: shippo.mode === 'production' ? '#E9F7EF' : '#FEF9E7', color: shippo.mode === 'production' ? T.ok : '#B7950B', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>{shippo.mode === 'production' ? '🚀 Production' : '🧪 Test'}</span>}
                <span style={{ background: shippo.actif ? '#E9F7EF' : '#f3f4f6', color: shippo.actif ? T.ok : T.light, padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>{shippo.actif ? '✅ Actif' : 'Inactif'}</span>
                <Interrupteur on={ouvert('shippo')} onClick={() => basculer(shippo)} />
              </span>
            </div>
            {!ouvert('shippo') && <p style={{ margin: 0, fontSize: 12, color: T.light }}>Allumez l'interrupteur pour utiliser Shippo. {shippo.configure ? 'Votre clé reste enregistrée.' : ''}</p>}

            {ouvert('shippo') && (<>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.light, marginBottom: 6 }}>Clé API Shippo (token)</label>
            <input value={cle} onChange={e => setCle(e.target.value)} type="password" autoComplete="off" spellCheck={false} maxLength={200}
              placeholder={shippo.configure ? '•••••••• (clé déjà enregistrée — collez-en une nouvelle pour la remplacer)' : 'shippo_test_…'} style={champ} />
            <p style={{ margin: '6px 0 14px', fontSize: 11, color: T.light }}>Elle est chiffrée dès qu'elle est enregistrée. Elle commence par « shippo_test_ » (essais gratuits) ou « shippo_live_ » (vraies étiquettes facturées).</p>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button disabled={occupe || (!cle.trim() && !shippo.configure)} style={btn(true)}
                onClick={() => envoyer({ token: cle.trim() || undefined, actif: true }, 'Shippo est activé : le bouton « Créer une étiquette » apparaît sur vos commandes payées.')}>
                {shippo.actif && ouvert('shippo') ? '💾 Enregistrer' : '✔ Enregistrer et activer'}
              </button>
              {shippo.configure && <button disabled={occupe} style={btn(false, true)} onClick={() => envoyer({ effacer: true }, 'Votre clé Shippo a été supprimée.').then(() => setChoisi(undefined))}>🗑️ Supprimer ma clé</button>}
            </div>
            </>)}
          </div>

          {ouvert('shippo') && (
          <div style={carte}>
            <strong style={{ fontSize: 14, color: T.text }}>📍 Suivi automatique des colis</strong>
            <p style={{ margin: '8px 0 10px', fontSize: 13, color: T.light, lineHeight: 1.6 }}>
              Pour que le statut de vos colis se mette à jour tout seul, ajoutez cette adresse dans <strong>votre</strong> compte Shippo :
              <em> Settings → API → Webhooks → Add webhook</em>, événement <strong>« Track updated »</strong>.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input readOnly value={URL_WEBHOOK} onFocus={e => e.currentTarget.select()} style={{ ...champ, flex: 1, minWidth: 220 }} />
              <button style={btn(false)} onClick={copier}>{copie ? '✅ Copié' : '📋 Copier'}</button>
            </div>
          </div>
          )}

        </>
      )}

      {easypost && easypost.addon_actif && (
        <>
          <div style={carte}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <strong style={{ fontSize: 15, color: T.text }}>📮 EasyPost</strong>
              <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <a href={URL_GUIDE_EP} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: accent, textDecoration: 'none', border: `1px solid ${accent}`, borderRadius: 12, padding: '2px 10px' }}>📖 Guide</a>
                {easypost.configure && <span style={{ background: easypost.mode === 'production' ? '#E9F7EF' : '#FEF9E7', color: easypost.mode === 'production' ? T.ok : '#B7950B', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>{easypost.mode === 'production' ? '🚀 Production' : '🧪 Test'}</span>}
                <span style={{ background: easypost.actif ? '#E9F7EF' : '#f3f4f6', color: easypost.actif ? T.ok : T.light, padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>{easypost.actif ? '✅ Actif' : 'Inactif'}</span>
                <Interrupteur on={ouvert('easypost')} onClick={() => basculer(easypost)} />
              </span>
            </div>
            {!ouvert('easypost') && <p style={{ margin: 0, fontSize: 12, color: T.light }}>Allumez l'interrupteur pour utiliser EasyPost. {easypost.configure ? 'Votre clé reste enregistrée.' : ''}</p>}

            {ouvert('easypost') && (<>

            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.light, marginBottom: 6 }}>Clé API EasyPost</label>
            <input value={cleEP} onChange={e => setCleEP(e.target.value)} type="password" autoComplete="off" spellCheck={false} maxLength={200}
              placeholder={easypost.configure ? '•••••••• (clé déjà enregistrée — collez-en une nouvelle pour la remplacer)' : 'EZTK… (test) ou EZAK… (production)'} style={champ} />
            <p style={{ margin: '6px 0 14px', fontSize: 11, color: T.light }}>Chiffrée dès l'enregistrement. Une clé « EZTK » active le mode test (gratuit) ; une clé « EZAK » active le mode production (vraies étiquettes facturées).</p>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button disabled={occupe || (!cleEP.trim() && !easypost.configure)} style={btn(true)}
                onClick={() => envoyer({ cle: cleEP.trim() || undefined, actif: true }, 'EasyPost est activé : le bouton « Créer une étiquette » apparaît sur vos commandes payées.', 'easypost')}>
                {easypost.actif && ouvert('easypost') ? '💾 Enregistrer' : '✔ Enregistrer et activer'}
              </button>
              {easypost.configure && <button disabled={occupe} style={btn(false, true)} onClick={() => envoyer({ effacer: true }, 'Vos clés EasyPost et votre secret webhook ont été supprimés.', 'easypost').then(() => setChoisi(undefined))}>🗑️ Tout supprimer</button>}
            </div>
            </>)}
          </div>

          {ouvert('easypost') && (
          <div style={carte}>
            <strong style={{ fontSize: 14, color: T.text }}>📍 Suivi automatique des colis</strong>
            <p style={{ margin: '8px 0 10px', fontSize: 13, color: T.light, lineHeight: 1.6 }}>
              Dans <strong>votre</strong> compte EasyPost : <em>Webhooks &amp; Events → Add webhook</em>, avec cette adresse. EasyPost vous donne alors un <strong>secret webhook</strong> : collez-le plus bas.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              <input readOnly value={URL_WEBHOOK_EP} onFocus={e => e.currentTarget.select()} style={{ ...champ, flex: 1, minWidth: 220 }} />
              <button style={btn(false)} onClick={copierEP}>{copieEP ? '✅ Copié' : '📋 Copier'}</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: T.light }}>Secret webhook EasyPost</label>
              <span style={{ background: easypost.secret_configure ? '#E9F7EF' : '#FEF9E7', color: easypost.secret_configure ? T.ok : '#B7950B', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{easypost.secret_configure ? '✓ Configuré' : '⚠️ Non configuré'}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input value={secretEP} onChange={e => setSecretEP(e.target.value)} type="password" autoComplete="off" spellCheck={false} maxLength={200}
                placeholder={easypost.secret_configure ? 'Collez un nouveau secret pour le remplacer' : 'Collez le secret webhook obtenu chez EasyPost'} style={{ ...champ, flex: 1, minWidth: 220 }} />
              <button disabled={occupe || !secretEP.trim() || !easypost.configure} style={btn(true)} onClick={() => envoyer({ secret: secretEP.trim() }, 'Secret webhook enregistré : le suivi automatique est actif.', 'easypost')}>💾 Enregistrer</button>
              {easypost.secret_configure && <button disabled={occupe} style={btn(false, true)} onClick={() => envoyer({ effacer_secret: true }, 'Secret webhook retiré : le suivi automatique est désactivé.', 'easypost')}>Retirer</button>}
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 11, color: T.light, lineHeight: 1.6 }}>
              🔒 Studio vérifie la signature de chaque mise à jour reçue, pour empêcher qu'on puisse forger un faux statut « livrée ». <strong>Sans ce secret, le suivi automatique est ignoré</strong> — l'achat d'étiquette, lui, fonctionne normalement.
              {!easypost.configure && ' Enregistrez d\'abord votre clé API.'}
            </p>
          </div>
          )}
        </>
      )}

      {postes && postes.addon_actif && (
        <div style={carte}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <strong style={{ fontSize: 15, color: T.text }}>🇨🇦 Postes Canada</strong>
            <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <a href={URL_GUIDE_PC} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: accent, textDecoration: 'none', border: `1px solid ${accent}`, borderRadius: 12, padding: '2px 10px' }}>📖 Guide</a>
              {postes.configure && <span style={{ background: postes.mode === 'production' ? '#E9F7EF' : '#FEF9E7', color: postes.mode === 'production' ? T.ok : '#B7950B', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>{postes.mode === 'production' ? '🚀 Production' : '🧪 Test'}</span>}
              <span style={{ background: postes.actif ? '#E9F7EF' : '#f3f4f6', color: postes.actif ? T.ok : T.light, padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>{postes.actif ? '✅ Actif' : 'Inactif'}</span>
              <Interrupteur on={ouvert('postescanada')} onClick={() => basculer(postes)} />
            </span>
          </div>
          {!ouvert('postescanada') && <p style={{ margin: 0, fontSize: 12, color: T.light }}>Allumez l'interrupteur pour utiliser Postes Canada directement (sans intermédiaire). {postes.configure ? 'Vos identifiants restent enregistrés.' : ''}</p>}

          {ouvert('postescanada') && (<>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.light, marginBottom: 6 }}>Clé API *</label>
            <input value={clePC} onChange={e => setClePC(e.target.value)} type="password" autoComplete="off" spellCheck={false} maxLength={200}
              placeholder={postes.configure ? '•••••••• (déjà enregistrée — collez-en une nouvelle pour la remplacer)' : 'Clé API du Portail des développeurs'} style={champ} />
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.light, margin: '12px 0 6px' }}>Code secret API *</label>
            <input value={secretPC} onChange={e => setSecretPC(e.target.value)} type="password" autoComplete="off" spellCheck={false} maxLength={200}
              placeholder={postes.configure ? '•••••••• (déjà enregistré — collez-en un nouveau pour le remplacer)' : 'Code secret API (affiché une seule fois à la création)'} style={champ} />
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.light, margin: '12px 0 6px' }}>Numéro de client *</label>
            <input value={numeroPC} onChange={e => setNumeroPC(e.target.value.replace(/\D/g, ''))} inputMode="numeric" autoComplete="off" maxLength={12} placeholder="ex. 0009999999" style={champ} />
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.light, margin: '12px 0 6px' }}>Environnement</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              {(['test', 'production'] as const).map(m => (
                <button key={m} type="button" disabled={occupe} onClick={() => setModePC(m)} style={{ ...btn(modePC === m), padding: '8px 14px' }}>{m === 'test' ? '🧪 Test' : '🚀 Production'}</button>
              ))}
            </div>
            <p style={{ margin: '0 0 14px', fontSize: 11, color: T.light, lineHeight: 1.6 }}>Doit correspondre au type d'application créée dans le Portail des développeurs. Vos identifiants sont chiffrés dès l'enregistrement. Une <strong>carte de crédit par défaut</strong> doit être enregistrée dans votre profil Postes Canada : c'est elle qui paie vos étiquettes.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button disabled={occupe || (!postes.configure && (!clePC.trim() || !secretPC.trim() || !numeroPC.trim())) || (postes.configure && !numeroPC.trim())} style={btn(true)}
                onClick={() => envoyer({ cle: clePC.trim() || undefined, secret: secretPC.trim() || undefined, numero_client: numeroPC.trim(), mode: modePC, actif: true }, 'Postes Canada est activé : le bouton « Créer une étiquette » apparaît sur vos commandes payées.', 'postescanada')}>
                {postes.actif && ouvert('postescanada') ? '💾 Enregistrer' : '✔ Enregistrer et activer'}
              </button>
              {postes.configure && <button disabled={occupe} style={btn(false, true)} onClick={() => envoyer({ effacer: true }, 'Vos identifiants Postes Canada ont été supprimés.', 'postescanada').then(() => { setChoisi(undefined); setNumeroPC(''); })}>🗑️ Tout supprimer</button>}
            </div>
            <div style={{ marginTop: 14, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, fontSize: 12, color: T.light, lineHeight: 1.6 }}>
              📍 <strong>Suivi automatique :</strong> rien à configurer. Studio interroge Postes Canada environ toutes les 30 minutes pour mettre à jour vos colis.
            </div>
          </>)}
        </div>
      )}

      {(shippo?.addon_actif || easypost?.addon_actif || postes?.addon_actif) && (
        <div style={{ ...carte, background: '#f8fafc' }}>
            <p style={{ margin: 0, fontSize: 12, color: T.light, lineHeight: 1.6 }}>
              📦 L'adresse d'expédition est celle de <strong>votre boutique</strong>. Vérifiez qu'elle est complète (adresse, ville, province, code postal) dans{' '}
              {naviguer ? <a onClick={() => naviguer('profil-boutique')} style={{ color: accent, cursor: 'pointer', fontWeight: 700 }}>Mon profil → Ma boutique</a> : <strong>Mon profil → Ma boutique</strong>}.
            </p>
          </div>
      )}
    </div>
  );
}