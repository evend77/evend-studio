// src/pages/admin/PageAdminTemplatesPrix.tsx
// e-Vend Studio — Dashboard admin : gestion des prix par catégorie et par template
//
// Le catalogue (liste des templates, catégories, noms, icônes) vient toujours
// du code (TEMPLATES / GROUPES dans PageTemplates.tsx) — cette page ne fait que
// lire/écrire les PRIX associés, stockés en BD. Un nouveau template ajouté au
// code apparaît donc automatiquement ici, avec "Gratuit" par défaut tant que
// l'admin n'a rien configuré.

import { useState, useEffect } from 'react';
import { TEMPLATES, GROUPES, type Groupe } from '../PageTemplates';

const API_BASE = '/api/admin/templates-prix';

type PrixType = 'gratuit' | 'unique' | 'abonnement' | 'paliers';

interface Palier { label: string; limite: number; prix: string; }

interface GroupePrixRow {
  groupe_id: string;
  prix_texte: string;
  prix_type: PrixType;
}

interface TemplatePrixRow {
  template_id: string;
  groupe_id: string | null;
  prix_texte: string | null;
  prix_type: PrixType;
  prix_paliers: Palier[] | null;
}

const TYPES_LABELS: Record<PrixType, string> = {
  gratuit: 'Gratuit',
  unique: 'Prix unique (achat)',
  abonnement: 'Abonnement mensuel',
  paliers: 'Paliers (selon volume)',
};

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export default function PageAdminTemplatesPrix() {
  const [groupesPrix, setGroupesPrix] = useState<Record<string, GroupePrixRow>>({});
  const [templatesPrix, setTemplatesPrix] = useState<Record<string, TemplatePrixRow>>({});
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [groupeOuvert, setGroupeOuvert] = useState<Groupe | null>(null);
  const [enregistrement, setEnregistrement] = useState<string | null>(null); // id en cours de sauvegarde
  const [messageOk, setMessageOk] = useState('');

  useEffect(() => { chargerDonnees(); }, []);

  async function chargerDonnees() {
    setChargement(true);
    setErreur('');
    try {
      const res = await fetch(API_BASE, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Erreur de chargement.');

      const gMap: Record<string, GroupePrixRow> = {};
      for (const g of data.groupes) gMap[g.groupe_id] = g;

      const tMap: Record<string, TemplatePrixRow> = {};
      for (const t of data.templates) tMap[t.template_id] = t;

      setGroupesPrix(gMap);
      setTemplatesPrix(tMap);
    } catch (e: any) {
      setErreur(e.message || 'Impossible de charger les prix.');
    } finally {
      setChargement(false);
    }
  }

  function flashOk(msg: string) {
    setMessageOk(msg);
    setTimeout(() => setMessageOk(''), 2500);
  }

  // ─── Sauvegarder le prix par défaut d'une catégorie ─────────────────────────
  async function sauvegarderGroupe(groupeId: string, prix_texte: string, prix_type: PrixType) {
    setEnregistrement(`groupe:${groupeId}`);
    try {
      const res = await fetch(`${API_BASE}/groupe/${groupeId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ prix_texte, prix_type }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setGroupesPrix(prev => ({ ...prev, [groupeId]: data.groupe }));
      flashOk('Prix de la catégorie enregistré.');
    } catch (e: any) {
      setErreur(e.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setEnregistrement(null);
    }
  }

  // ─── Sauvegarder le prix d'un template (surcharge) ──────────────────────────
  async function sauvegarderTemplate(templateId: string, groupeId: string, prix_texte: string, prix_type: PrixType, prix_paliers: Palier[] | null) {
    setEnregistrement(`template:${templateId}`);
    try {
      const res = await fetch(`${API_BASE}/template/${templateId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ groupe_id: groupeId, prix_texte, prix_type, prix_paliers }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setTemplatesPrix(prev => ({ ...prev, [templateId]: data.template }));
      flashOk('Prix du template enregistré.');
    } catch (e: any) {
      setErreur(e.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setEnregistrement(null);
    }
  }

  // ─── Retirer la surcharge d'un template (retombe sur le défaut catégorie) ──
  async function retirerSurchargeTemplate(templateId: string) {
    setEnregistrement(`template:${templateId}`);
    try {
      const res = await fetch(`${API_BASE}/template/${templateId}`, { method: 'DELETE', headers: getAuthHeaders() });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setTemplatesPrix(prev => {
        const copie = { ...prev };
        delete copie[templateId];
        return copie;
      });
      flashOk('Surcharge retirée — hérite du prix de la catégorie.');
    } catch (e: any) {
      setErreur(e.message || 'Erreur lors du retrait.');
    } finally {
      setEnregistrement(null);
    }
  }

  if (chargement) {
    return <div style={s.page}><p style={s.chargementTxt}>Chargement des prix…</p></div>;
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.titre}>Prix des templates</h1>
          <p style={s.sousTitre}>
            {TEMPLATES.length} templates au total. Définissez un prix par défaut pour chaque catégorie,
            et surchargez-le individuellement pour un template précis si besoin.
          </p>
        </div>
        {messageOk && <div style={s.badgeOk}>✓ {messageOk}</div>}
      </div>

      {erreur && <div style={s.erreurBox}>{erreur} <button style={s.btnRetry} onClick={chargerDonnees}>Réessayer</button></div>}

      {GROUPES.map(groupe => {
        const prixGroupe = groupesPrix[groupe.id] || { groupe_id: groupe.id, prix_texte: 'Gratuit', prix_type: 'gratuit' as PrixType };
        const templatesDuGroupe = TEMPLATES.filter(t => t.groupe === groupe.id);
        const nbSurcharges = templatesDuGroupe.filter(t => templatesPrix[t.id]).length;

        return (
          <div key={groupe.id} style={s.groupeCard}>
            <div style={s.groupeHeader} onClick={() => setGroupeOuvert(groupeOuvert === groupe.id ? null : groupe.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22 }}>{groupe.icone}</span>
                <div>
                  <p style={s.groupeLabel}>{groupe.label}</p>
                  <p style={s.groupeMeta}>
                    {templatesDuGroupe.length} template{templatesDuGroupe.length > 1 ? 's' : ''}
                    {nbSurcharges > 0 && ` · ${nbSurcharges} avec prix personnalisé`}
                  </p>
                </div>
              </div>
              <span style={s.chevron}>{groupeOuvert === groupe.id ? '▲' : '▼'}</span>
            </div>

            {/* Prix par défaut de la catégorie — toujours visible */}
            <LigneEditionPrix
              couleur={groupe.couleur}
              prixTexteInitial={prixGroupe.prix_texte}
              prixTypeInitial={prixGroupe.prix_type}
              enregistrement={enregistrement === `groupe:${groupe.id}`}
              onSave={(texte, type) => sauvegarderGroupe(groupe.id, texte, type)}
              label="Prix par défaut de la catégorie"
              autoriserPaliers={false}
            />

            {/* Templates individuels — dépliable */}
            {groupeOuvert === groupe.id && (
              <div style={s.listeTemplates}>
                {templatesDuGroupe.map(t => {
                  const surcharge = templatesPrix[t.id];
                  const herite = !surcharge;
                  return (
                    <div key={t.id} style={s.templateRow}>
                      <div style={s.templateInfo}>
                        <span style={{ fontSize: 15 }}>{t.icone || '📄'}</span>
                        <span style={s.templateNom}>{t.nom}</span>
                        {!t.disponible && <span style={s.badgeBientot}>Bientôt</span>}
                        {herite && <span style={s.badgeHerite}>hérite de la catégorie</span>}
                      </div>
                      <LigneEditionPrix
                        couleur={groupe.couleur}
                        prixTexteInitial={surcharge?.prix_texte || prixGroupe.prix_texte}
                        prixTypeInitial={surcharge?.prix_type || prixGroupe.prix_type}
                        prixPaliersInitial={surcharge?.prix_paliers || null}
                        enregistrement={enregistrement === `template:${t.id}`}
                        onSave={(texte, type, paliers) => sauvegarderTemplate(t.id, groupe.id, texte, type, paliers)}
                        onReset={surcharge ? () => retirerSurchargeTemplate(t.id) : undefined}
                        compact
                        autoriserPaliers
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Sous-composant : ligne d'édition de prix (catégorie ou template) ─────────

function LigneEditionPrix({
  couleur, prixTexteInitial, prixTypeInitial, prixPaliersInitial = null,
  enregistrement, onSave, onReset, label, compact = false, autoriserPaliers = true,
}: {
  couleur: string;
  prixTexteInitial: string;
  prixTypeInitial: PrixType;
  prixPaliersInitial?: Palier[] | null;
  enregistrement: boolean;
  onSave: (texte: string, type: PrixType, paliers: Palier[] | null) => void;
  onReset?: () => void;
  label?: string;
  compact?: boolean;
  autoriserPaliers?: boolean;
}) {
  const [texte, setTexte] = useState(prixTexteInitial);
  const [type, setType] = useState<PrixType>(prixTypeInitial);
  const [paliers, setPaliers] = useState<Palier[]>(prixPaliersInitial || []);
  const [modifie, setModifie] = useState(false);

  useEffect(() => {
    setTexte(prixTexteInitial);
    setType(prixTypeInitial);
    setPaliers(prixPaliersInitial || []);
    setModifie(false);
  }, [prixTexteInitial, prixTypeInitial, prixPaliersInitial]);

  function marquerModifie() { setModifie(true); }

  function ajouterPalier() {
    setPaliers(prev => [...prev, { label: '', limite: 0, prix: '' }]);
    marquerModifie();
  }
  function majPalier(i: number, champ: keyof Palier, val: string) {
    setPaliers(prev => prev.map((p, idx) => idx === i ? { ...p, [champ]: champ === 'limite' ? Number(val) : val } : p));
    marquerModifie();
  }
  function retirerPalier(i: number) {
    setPaliers(prev => prev.filter((_, idx) => idx !== i));
    marquerModifie();
  }

  return (
    <div style={compact ? s.ligneEditionCompact : s.ligneEdition}>
      {label && <p style={s.ligneLabel}>{label}</p>}
      <div style={s.ligneChamps}>
        <select
          value={type}
          onChange={e => { setType(e.target.value as PrixType); marquerModifie(); }}
          style={s.select}
        >
          {Object.entries(TYPES_LABELS).map(([val, lbl]) => (
            (autoriserPaliers || val !== 'paliers') && <option key={val} value={val}>{lbl}</option>
          ))}
        </select>

        {type !== 'gratuit' && type !== 'paliers' && (
          <input
            type="text"
            value={texte}
            onChange={e => { setTexte(e.target.value); marquerModifie(); }}
            placeholder="ex: 25$ / achat unique"
            style={s.input}
          />
        )}

        {type === 'gratuit' && <span style={s.texteGratuit}>Gratuit</span>}

        <button
          disabled={!modifie || enregistrement}
          onClick={() => { onSave(type === 'gratuit' ? 'Gratuit' : texte, type, type === 'paliers' ? paliers : null); setModifie(false); }}
          style={{ ...s.btnSave, background: modifie ? couleur : 'rgba(255,255,255,0.08)', color: modifie ? '#000' : 'rgba(255,255,255,0.3)', cursor: modifie ? 'pointer' : 'not-allowed' }}
        >
          {enregistrement ? '…' : 'Enregistrer'}
        </button>

        {onReset && (
          <button onClick={onReset} style={s.btnReset} title="Retirer la surcharge, hériter du prix de la catégorie">
            ↺ Réinitialiser
          </button>
        )}
      </div>

      {type === 'paliers' && (
        <div style={s.paliersBox}>
          {paliers.map((p, i) => (
            <div key={i} style={s.palierRow}>
              <input placeholder="Label (ex: Débutant)" value={p.label} onChange={e => majPalier(i, 'label', e.target.value)} style={s.inputPalier} />
              <input placeholder="Limite (ex: 25)" type="number" value={p.limite || ''} onChange={e => majPalier(i, 'limite', e.target.value)} style={{ ...s.inputPalier, width: 90 }} />
              <input placeholder="Prix (ex: 15,99$)" value={p.prix} onChange={e => majPalier(i, 'prix', e.target.value)} style={s.inputPalier} />
              <button onClick={() => retirerPalier(i)} style={s.btnSupprimerPalier}>✕</button>
            </div>
          ))}
          <button onClick={ajouterPalier} style={s.btnAjouterPalier}>+ Ajouter un palier</button>
        </div>
      )}
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#0a0a0a', color: '#fff', padding: '32px 24px', fontFamily: "'Inter', sans-serif" },
  chargementTxt: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 60 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16, flexWrap: 'wrap' },
  titre: { fontSize: 24, fontWeight: 800, marginBottom: 4 },
  sousTitre: { fontSize: 13, color: 'rgba(255,255,255,0.45)', maxWidth: 560 },
  badgeOk: { background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.4)', color: '#4ade80', padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' },
  erreurBox: { background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#f87171', padding: '12px 16px', borderRadius: 10, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  btnRetry: { background: 'transparent', border: '1px solid #f87171', color: '#f87171', padding: '4px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer' },

  groupeCard: { background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, marginBottom: 14, overflow: 'hidden' },
  groupeHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', cursor: 'pointer' },
  groupeLabel: { fontSize: 15, fontWeight: 700, color: '#fff' },
  groupeMeta: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  chevron: { color: 'rgba(255,255,255,0.3)', fontSize: 12 },

  ligneEdition: { padding: '0 20px 18px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 14 },
  ligneEditionCompact: { flex: 1, minWidth: 0 },
  ligneLabel: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' },
  ligneChamps: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },

  select: { background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', fontSize: 13, padding: '7px 10px', fontFamily: 'inherit' },
  input: { flex: 1, minWidth: 140, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', fontSize: 13, padding: '7px 10px', fontFamily: 'inherit' },
  texteGratuit: { fontSize: 13, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' },

  btnSave: { border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' },
  btnReset: { background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', borderRadius: 8, padding: '7px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' },

  listeTemplates: { borderTop: '1px solid rgba(255,255,255,0.06)' },
  templateRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', flexWrap: 'wrap' },
  templateInfo: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 200 },
  templateNom: { fontSize: 13, fontWeight: 600, color: '#fff' },
  badgeBientot: { fontSize: 10, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', padding: '2px 8px', borderRadius: 20 },
  badgeHerite: { fontSize: 10, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', padding: '2px 8px', borderRadius: 20, fontStyle: 'italic' },

  paliersBox: { marginTop: 10, padding: 12, background: '#0a0a0a', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' },
  palierRow: { display: 'flex', gap: 6, marginBottom: 6 },
  inputPalier: { flex: 1, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 12, padding: '6px 8px', fontFamily: 'inherit' },
  btnSupprimerPalier: { background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', color: '#f87171', borderRadius: 6, width: 28, cursor: 'pointer' },
  btnAjouterPalier: { background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.5)', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 },
};