// CHEMIN : src/pages/collaborateur/CollaborateurEtiquettes.tsx
// e-Vend Studio — Dashboard collaborateur : configuration des étiquettes d'expédition (add-on « Étiquettes Shippo »).
// Adapté de ConfigurationGenerale.tsx (e-Vend, section Expédition). Chaque collaborateur colle SA PROPRE clé Shippo :
// elle est chiffrée côté serveur et n'est jamais renvoyée au navigateur. Un seul transporteur actif à la fois.
// API : /api/collab/:gestionnaireId/etiquettes/config · PUT /etiquettes/shippo

import React, { useState, useEffect, useCallback } from 'react';

interface Transporteur { code: string; nom: string; addon_actif: boolean; configure: boolean; mode: string; actif: boolean }
interface Props { gestionnaireId: number; accent: string; isMobile: boolean; naviguer?: (page: string) => void }

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', danger: '#dc2626', ok: '#1E8449' };
const URL_WEBHOOK = 'https://e-vendstudio.ca/api/webhooks-etiquettes/shippo';
const URL_GUIDE = 'https://e-vendstudio.ca/documents/mv-guide-des-etiquettes-shippo-add-on';

export default function CollaborateurEtiquettes({ gestionnaireId, accent, isMobile, naviguer }: Props) {
  const base = `/api/collab/${gestionnaireId}/etiquettes`;
  const [liste, setListe] = useState<Transporteur[] | null>(null);
  const [cle, setCle] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState(''); const [info, setInfo] = useState('');
  const [copie, setCopie] = useState(false);

  const charger = useCallback(async () => {
    try {
      const res = await fetch(`${base}/config`, { credentials: 'include' });
      const j = await res.json().catch(() => ({}));
      if (res.ok) { setListe(j.transporteurs || []); setErreur(''); } else setErreur(j.error || 'Chargement impossible');
    } catch { setErreur('Erreur réseau'); }
  }, [base]);
  useEffect(() => { charger(); }, [charger]);

  const envoyer = async (corps: object, message: string) => {
    setOccupe(true); setErreur(''); setInfo('');
    try {
      const res = await fetch(`${base}/shippo`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });
      const j = await res.json().catch(() => ({}));
      if (res.ok) { setListe(j.transporteurs || []); setCle(''); setInfo(message); } else setErreur(j.error || 'Action impossible');
    } catch { setErreur('Erreur réseau'); }
    setOccupe(false);
  };

  const copier = async () => {
    try { await navigator.clipboard.writeText(URL_WEBHOOK); setCopie(true); setTimeout(() => setCopie(false), 2000); } catch { /* le champ reste sélectionnable à la main */ }
  };

  const shippo = (liste || []).find(t => t.code === 'shippo');
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
        <a href={URL_GUIDE} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 700, color: accent, textDecoration: 'none', border: `1px solid ${accent}`, borderRadius: 8, padding: '7px 12px' }}>📖 Guide</a>
      </div>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: T.light, lineHeight: 1.6 }}>
        Achetez vos étiquettes directement depuis une commande, avec les tarifs réels des transporteurs, et suivez la livraison automatiquement.
        Vous utilisez <strong>votre propre compte Shippo</strong> : les étiquettes sont facturées à votre compte, et l'expédition part de l'adresse de votre boutique.
      </p>

      {erreur && <div style={{ background: '#FDECEA', color: '#C0392B', padding: '9px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{erreur}</div>}
      {info && <div style={{ background: '#E9F7EF', color: T.ok, padding: '9px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{info}</div>}
      {!liste && !erreur && <div style={{ padding: 30, textAlign: 'center', color: T.light }}>Chargement…</div>}

      {shippo && !shippo.addon_actif && (
        <div style={{ ...carte, background: '#FEF9E7', borderColor: '#F1C40F' }}>
          <p style={{ margin: 0, fontSize: 13, color: '#7d6608' }}>🔒 L'option « Étiquettes Shippo » n'est pas activée pour cette marketplace. Demandez au gestionnaire de l'activer.</p>
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
              </span>
            </div>

            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.light, marginBottom: 6 }}>Clé API Shippo (token)</label>
            <input value={cle} onChange={e => setCle(e.target.value)} type="password" autoComplete="off" spellCheck={false} maxLength={200}
              placeholder={shippo.configure ? '•••••••• (clé déjà enregistrée — collez-en une nouvelle pour la remplacer)' : 'shippo_test_…'} style={champ} />
            <p style={{ margin: '6px 0 14px', fontSize: 11, color: T.light }}>Elle est chiffrée dès qu'elle est enregistrée. Elle commence par « shippo_test_ » (essais gratuits) ou « shippo_live_ » (vraies étiquettes facturées).</p>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button disabled={occupe || (!cle.trim() && !shippo.configure)} style={btn(true)}
                onClick={() => envoyer({ token: cle.trim() || undefined, actif: true }, 'Shippo est activé : le bouton « Créer une étiquette » apparaît sur vos commandes payées.')}>
                {shippo.actif ? '💾 Enregistrer' : '✔ Enregistrer et activer'}
              </button>
              {shippo.actif && <button disabled={occupe} style={btn(false)} onClick={() => envoyer({ actif: false }, 'Shippo est désactivé.')}>Désactiver</button>}
              {shippo.configure && <button disabled={occupe} style={btn(false, true)} onClick={() => envoyer({ effacer: true }, 'Votre clé Shippo a été supprimée.')}>🗑️ Supprimer ma clé</button>}
            </div>
          </div>

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

          <div style={{ ...carte, background: '#f8fafc' }}>
            <p style={{ margin: 0, fontSize: 12, color: T.light, lineHeight: 1.6 }}>
              📦 L'adresse d'expédition est celle de <strong>votre boutique</strong>. Vérifiez qu'elle est complète (adresse, ville, province, code postal) dans{' '}
              {naviguer ? <a onClick={() => naviguer('profil-boutique')} style={{ color: accent, cursor: 'pointer', fontWeight: 700 }}>Mon profil → Ma boutique</a> : <strong>Mon profil → Ma boutique</strong>}.
            </p>
          </div>
        </>
      )}
    </div>
  );
}