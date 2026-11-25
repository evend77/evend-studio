// src/pages/gestionnaire/ConfigMesPagesCagnotte.tsx
// e-Vend Studio — Gestionnaire : configuration de la campagne de cagnotte (template « Cagnotte Classique »).
// Sauvegarde dans sites.config.cagnotte (même mécanisme que les autres templates). Le prix de publication se règle et se paie dans « Ma Cagnotte ».

import { useState, useEffect, useRef } from 'react';
import TemplateCagnotteClassique, { CONFIG_CAGNOTTE_DEFAUT, MODELES_CAGNOTTE, type ConfigCagnotte, type SousTypeCagnotte } from '../../templates/TemplateCagnotteClassique';

interface Props {
  gestionnaireId: number;
  naviguer?: (page: string) => void;   // pour le bouton « Aller publier »
}

interface EtatCampagne {
  duree_max_jours: number;
  campagne: { statut: string; palier_nom: string | null; fin_le: string | null } | null;
  apercu: { palier: { nom: string; objectif_max: number | null }; prix: number } | null;
  problemes: string[];
}

const POLICES: { v: ConfigCagnotte['police']; label: string }[] = [{ v: 'moderne', label: 'Moderne' }, { v: 'classique', label: 'Classique' }, { v: 'manuscrite', label: 'Manuscrite' }];
const ONGLETS = [{ id: 'campagne', label: '🎯 Campagne' }, { id: 'organisateur', label: '👤 Organisateur' }, { id: 'dons', label: '💝 Dons' }, { id: 'apparence', label: '🎨 Apparence' }, { id: 'nouvelles', label: '📰 Mises à jour' }, { id: 'contact', label: '🔗 Liens' }] as const;
type Onglet = typeof ONGLETS[number]['id'];

const jourISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const argent = (n: number) => `${n.toLocaleString('fr-CA')} $`;

function entetes(): HeadersInit {
  const token = localStorage.getItem('token') || '';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export default function ConfigMesPagesCagnotte({ gestionnaireId, naviguer }: Props) {
  const [cfg, setCfg] = useState<ConfigCagnotte>(CONFIG_CAGNOTTE_DEFAUT);
  const [onglet, setOnglet] = useState<Onglet>('campagne');
  const [etat, setEtat] = useState<EtatCampagne | null>(null);
  const [sauv, setSauv] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [msg, setMsg] = useState('');
  const [modifie, setModifie] = useState(false);
  const [modeleEnAttente, setModeleEnAttente] = useState<SousTypeCagnotte | null>(null);
  const [largeur, setLargeur] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [apercuOuvert, setApercuOuvert] = useState(false);
  const charge = useRef(false);

  useEffect(() => {
    const f = () => setLargeur(window.innerWidth);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);

  const chargerEtat = () => {
    fetch('/api/cagnotte/campagne/etat', { headers: entetes(), credentials: 'include' })
      .then(r => (r.ok ? r.json() : null)).then(d => { if (d) setEtat(d); }).catch(() => {});
  };

  useEffect(() => {
    fetch(`/api/studio/sites/${gestionnaireId}`, { headers: entetes(), credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        const brut = data && data.config && typeof data.config === 'object' ? data.config.cagnotte : null;
        if (brut && typeof brut === 'object') setCfg(prev => ({ ...prev, ...brut, montantsSuggeres: Array.isArray(brut.montantsSuggeres) && brut.montantsSuggeres.length ? brut.montantsSuggeres : prev.montantsSuggeres, misesAJour: Array.isArray(brut.misesAJour) ? brut.misesAJour : prev.misesAJour }));
      })
      .catch(() => {})
      .finally(() => { charge.current = true; });
    chargerEtat();
  }, [gestionnaireId]);

  const maj = (p: Partial<ConfigCagnotte>) => { setCfg(c => ({ ...c, ...p })); setModifie(true); };
  const dureeMax = etat ? etat.duree_max_jours : 90;
  const maxDate = jourISO(new Date(Date.now() + dureeMax * 86400000));
  const minDate = jourISO(new Date(Date.now() + 2 * 86400000));
  const dateFinJour = cfg.dateFinCampagne ? jourISO(new Date(cfg.dateFinCampagne)) : '';
  const objectif = Number(cfg.objectifMontant) || 0;
  const palierAtteint = etat && etat.apercu && objectif > 0;
  const dejaOuverte = !!(etat && etat.campagne && etat.campagne.statut === 'publiee');

  function appliquerModele(t: SousTypeCagnotte) {
    const m = MODELES_CAGNOTTE[t];
    maj({ sousType: t, slogan: m.slogan, nomCampagne: m.nomCampagne, descriptionCampagne: m.description, messageRemerciement: m.remerciement });
    setModeleEnAttente(null);
  }

  async function enregistrer() {
    setMsg('');
    if (!cfg.nomCampagne.trim()) { setMsg('Donnez un titre à votre campagne.'); setOnglet('campagne'); setSauv('err'); return; }
    if (!(objectif > 0) || objectif > 1000000) { setMsg("L'objectif doit être un montant entre 1 $ et 1 000 000 $."); setOnglet('campagne'); setSauv('err'); return; }
    if (cfg.dateFinCampagne && dateFinJour > maxDate) { setMsg(`La date de fin ne peut pas dépasser ${dureeMax} jours.`); setOnglet('campagne'); setSauv('err'); return; }
    if (cfg.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cfg.email)) { setMsg('Adresse courriel invalide (onglet Liens).'); setOnglet('contact'); setSauv('err'); return; }
    const montants = cfg.montantsSuggeres.map(Number).filter(n => Number.isFinite(n) && n > 0).slice(0, 4);
    if (!montants.length) { setMsg('Ajoutez au moins un montant suggéré.'); setOnglet('dons'); setSauv('err'); return; }
    setSauv('loading');
    try {
      const donnees = { ...cfg, objectifMontant: objectif, montantsSuggeres: Array.from(new Set<number>(montants)).sort((a: number, b: number) => a - b) };
      const res = await fetch(`/api/studio/sites/${gestionnaireId}/config`, { method: 'PUT', headers: entetes(), credentials: 'include', body: JSON.stringify({ config: { cagnotte: donnees }, template_id: 'cagnotte-classique' }) });
      if (!res.ok) throw new Error();
      setCfg(donnees); setModifie(false); setSauv('ok'); chargerEtat();
      setTimeout(() => setSauv('idle'), 2500);
    } catch { setMsg("Enregistrement impossible. Réessayez."); setSauv('err'); setTimeout(() => setSauv('idle'), 3500); }
  }

  const apercuDesktop = largeur >= 1180;

  return (
    <div style={{ background: '#f7f7f5', minHeight: '100vh', padding: largeur < 700 ? '16px 12px 90px' : '28px 28px 90px', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', maxWidth: 1500 }}>
        <div style={{ flex: 1, minWidth: 0, maxWidth: 820 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#c9a96e22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>💝</div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Ma campagne</h1>
              <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Texte, objectif, photos et couleurs de votre page de dons.</p>
            </div>
          </div>

          {/* Prix de publication */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              {dejaOuverte
                ? <p style={{ margin: 0, fontSize: 13.5, color: '#166534' }}>✅ Votre campagne est <b>ouverte aux dons</b>{etat && etat.campagne && etat.campagne.fin_le ? ` jusqu'au ${new Date(etat.campagne.fin_le).toLocaleDateString('fr-CA')}` : ''}.</p>
                : palierAtteint
                  ? <p style={{ margin: 0, fontSize: 13.5, color: '#444' }}>Pour un objectif de <b>{argent(objectif)}</b> : palier « <b>{etat!.apercu!.palier.nom}</b> », prix fixe de publication <b>{argent(etat!.apercu!.prix)}</b> + taxes. Aucune commission sur les dons, durée maximale {dureeMax} jours.</p>
                  : <p style={{ margin: 0, fontSize: 13.5, color: '#444' }}>Indiquez votre objectif pour voir le prix fixe de publication (aucune commission sur les dons).</p>}
            </div>
            {naviguer && !dejaOuverte && <button onClick={() => naviguer('commandes-cagnotte')} style={btnSec}>Aller publier →</button>}
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {ONGLETS.map(o => <button key={o.id} onClick={() => setOnglet(o.id)} style={{ ...btnOnglet, ...(onglet === o.id ? btnOngletActif : {}) }}>{o.label}</button>)}
          </div>

          <div style={carte}>
            {onglet === 'campagne' && (
              <>
                <Champ label="Modèle de départ (facultatif)" aide="Un clic remplit le titre, le slogan et le texte avec un exemple que vous pouvez modifier à votre guise.">
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(Object.keys(MODELES_CAGNOTTE) as SousTypeCagnotte[]).map(t => (
                      <button key={t} onClick={() => setModeleEnAttente(t)} style={{ ...btnOnglet, ...(cfg.sousType === t ? { borderColor: '#c9a96e', background: '#c9a96e18' } : {}) }}>{MODELES_CAGNOTTE[t].emoji} {MODELES_CAGNOTTE[t].label}</button>
                    ))}
                  </div>
                  {modeleEnAttente && (
                    <div style={{ marginTop: 10, background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 12px', fontSize: 13 }}>
                      Remplacer votre titre, slogan, description et message de remerciement par le modèle « {(MODELES_CAGNOTTE as any)[modeleEnAttente].label} » ?
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button onClick={() => appliquerModele(modeleEnAttente)} style={btnPrim}>Oui, remplacer</button>
                        <button onClick={() => setModeleEnAttente(null)} style={btnSec}>Annuler</button>
                      </div>
                    </div>
                  )}
                </Champ>
                <Champ label="Titre de la campagne"><Texte v={cfg.nomCampagne} on={v => maj({ nomCampagne: v })} max={120} /></Champ>
                <Champ label="Slogan" aide="Une phrase sous le titre."><Texte v={cfg.slogan} on={v => maj({ slogan: v })} max={160} /></Champ>
                <Champ label="Histoire de la campagne" aide="Expliquez le besoin et à quoi serviront les dons. Les sauts de ligne sont conservés."><Zone v={cfg.descriptionCampagne} on={v => maj({ descriptionCampagne: v })} max={6000} rows={9} /></Champ>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <Champ label="Objectif ($)" aide="Détermine votre palier de prix." flex>
                    <input style={champ} inputMode="numeric" value={objectif ? String(objectif) : ''} onChange={e => maj({ objectifMontant: Number(e.target.value.replace(/\D/g, '')) })} /></Champ>
                  <Champ label={`Date de fin (max. ${dureeMax} jours)`} aide="Vide = ouverte pendant la durée maximale." flex>
                    <input style={champ} type="date" min={minDate} max={maxDate} value={dateFinJour} onChange={e => maj({ dateFinCampagne: e.target.value ? new Date(`${e.target.value}T23:59:59`).toISOString() : '' })} /></Champ>
                </div>
                {cfg.dateFinCampagne && dateFinJour > maxDate && <p style={alerte}>⚠️ Cette date dépasse {dureeMax} jours : choisissez une date plus rapprochée.</p>}
                <Champ label="Photo de la campagne (adresse https://…)"><Texte v={cfg.photoCampagne} on={v => maj({ photoCampagne: v })} max={1000} placeholder="https://…" /></Champ>
                <Champ label="Grande photo du haut de page (adresse https://…)"><Texte v={cfg.photoHeroUrl} on={v => maj({ photoHeroUrl: v })} max={1000} placeholder="https://…" /></Champ>
              </>
            )}
            {onglet === 'organisateur' && (
              <>
                <Champ label="Nom affiché dans le menu du haut"><Texte v={cfg.nomEntreprise} on={v => maj({ nomEntreprise: v })} max={80} /></Champ>
                <Champ label="Logo (adresse https://…, facultatif)"><Texte v={cfg.logoUrl} on={v => maj({ logoUrl: v })} max={1000} placeholder="https://…" /></Champ>
                <Champ label="Organisé par"><Texte v={cfg.nomOrganisateur} on={v => maj({ nomOrganisateur: v })} max={100} /></Champ>
                <Champ label="Présentation de l'organisateur"><Zone v={cfg.bioOrganisateur} on={v => maj({ bioOrganisateur: v })} max={500} rows={3} /></Champ>
                <Champ label="Photo de l'organisateur (adresse https://…, facultatif)"><Texte v={cfg.photoOrganisateur} on={v => maj({ photoOrganisateur: v })} max={1000} placeholder="https://…" /></Champ>
                <p style={{ ...aide, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 10 }}>ℹ️ Vous êtes responsable de votre collecte et de l'utilisation des fonds. Un avis à ce sujet est affiché automatiquement sur votre page. Selon votre province et le type de collecte, des règles peuvent s'appliquer : renseignez-vous auprès des autorités compétentes.</p>
              </>
            )}
            {onglet === 'dons' && (
              <>
                <Champ label="Montants suggérés ($, jusqu'à 4)">
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[0, 1, 2, 3].map(i => (
                      <input key={i} style={{ ...champ, width: 90 }} inputMode="numeric" placeholder="—" value={cfg.montantsSuggeres[i] ? String(cfg.montantsSuggeres[i]) : ''}
                        onChange={e => { const a = [...cfg.montantsSuggeres]; a[i] = Number(e.target.value.replace(/\D/g, '')); maj({ montantsSuggeres: a }); }} />
                    ))}
                  </div>
                </Champ>
                <Champ label="Don minimum ($)" aide="Le minimum de la plateforme s'applique aussi."><input style={{ ...champ, width: 120 }} inputMode="numeric" value={cfg.montantMinimum ? String(cfg.montantMinimum) : ''} onChange={e => maj({ montantMinimum: Number(e.target.value.replace(/\D/g, '')) })} /></Champ>
                <Champ label="Message de remerciement" aide="Affiché au donateur juste après son paiement."><Zone v={cfg.messageRemerciement} on={v => maj({ messageRemerciement: v })} max={500} rows={3} /></Champ>
                <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14, color: '#333', cursor: 'pointer' }}>
                  <input type="checkbox" checked={cfg.afficherDonateurs !== false} onChange={e => maj({ afficherDonateurs: e.target.checked })} /> Afficher la liste des derniers donateurs (les dons anonymes restent anonymes)
                </label>
                <p style={{ ...aide, marginTop: 14 }}>💳 Pour recevoir les dons, branchez votre Stripe et/ou PayPal dans « Ma Cagnotte » → Paiements.</p>
              </>
            )}
            {onglet === 'apparence' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
                  <Couleur label="Couleur principale" v={cfg.couleurPrincipale} on={v => maj({ couleurPrincipale: v })} />
                  <Couleur label="Couleur du titre / pied de page" v={cfg.couleurSecondaire} on={v => maj({ couleurSecondaire: v })} />
                  <Couleur label="Fond de page" v={cfg.couleurFond} on={v => maj({ couleurFond: v })} />
                  <Couleur label="Texte" v={cfg.couleurTexte} on={v => maj({ couleurTexte: v })} />
                </div>
                <Champ label="Police">
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {POLICES.map(p => <button key={p.v} onClick={() => maj({ police: p.v })} style={{ ...btnOnglet, ...(cfg.police === p.v ? { borderColor: '#c9a96e', background: '#c9a96e18' } : {}) }}>{p.label}</button>)}
                  </div>
                </Champ>
              </>
            )}
            {onglet === 'nouvelles' && (
              <>
                <p style={aide}>Donnez des nouvelles à vos donateurs : elles s'affichent sous l'histoire de la campagne.</p>
                {cfg.misesAJour.map((m, i) => (
                  <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <input style={{ ...champ, flex: 1 }} placeholder="Titre" maxLength={100} value={m.titre} onChange={e => maj({ misesAJour: cfg.misesAJour.map((x, j) => (j === i ? { ...x, titre: e.target.value } : x)) })} />
                      <button onClick={() => maj({ misesAJour: cfg.misesAJour.filter((_, j) => j !== i) })} style={btnX} aria-label="Supprimer">✕</button>
                    </div>
                    <Zone v={m.texte} on={v => maj({ misesAJour: cfg.misesAJour.map((x, j) => (j === i ? { ...x, texte: v } : x)) })} max={1000} rows={3} />
                  </div>
                ))}
                <button disabled={cfg.misesAJour.length >= 20} onClick={() => maj({ misesAJour: [{ date: new Date().toISOString(), titre: '', texte: '' }, ...cfg.misesAJour] })} style={btnSec}>+ Ajouter une nouvelle</button>
              </>
            )}
            {onglet === 'contact' && (
              <>
                <Champ label="Courriel de contact (facultatif)"><Texte v={cfg.email} on={v => maj({ email: v })} max={120} placeholder="nom@exemple.com" /></Champ>
                <Champ label="Facebook (nom de la page ou adresse https://…)"><Texte v={cfg.facebook} on={v => maj({ facebook: v })} max={200} /></Champ>
                <Champ label="Instagram (nom d'utilisateur ou adresse https://…)"><Texte v={cfg.instagram} on={v => maj({ instagram: v })} max={200} /></Champ>
                <Champ label="Site web (adresse https://…)"><Texte v={cfg.siteExterne} on={v => maj({ siteExterne: v })} max={300} placeholder="https://…" /></Champ>
              </>
            )}
          </div>

          {apercuDesktop === false && (
            <div style={{ marginTop: 14 }}>
              <button onClick={() => setApercuOuvert(o => !o)} style={btnSec}>{apercuOuvert ? 'Masquer l\'aperçu' : '👁 Voir l\'aperçu'}</button>
              {apercuOuvert && <Apercu cfg={cfg} largeurBoite={Math.min(largeur - 24, 420)} />}
            </div>
          )}
        </div>

        {apercuDesktop && (
          <div style={{ position: 'sticky', top: 16, width: 380, flexShrink: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Aperçu (chiffres de démonstration)</p>
            <Apercu cfg={cfg} largeurBoite={380} />
          </div>
        )}
      </div>

      {/* Barre d'enregistrement */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, background: '#ffffffee', backdropFilter: 'blur(8px)', borderTop: '1px solid #e5e7eb', padding: '10px 16px', display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'flex-end', zIndex: 50 }}>
        {msg && <span style={{ fontSize: 13, color: '#b91c1c', marginRight: 'auto' }}>⚠️ {msg}</span>}
        {sauv === 'ok' && <span style={{ fontSize: 13, color: '#166534', marginRight: 'auto' }}>✓ Enregistré</span>}
        {modifie && sauv === 'idle' && !msg && <span style={{ fontSize: 12, color: '#888', marginRight: 'auto' }}>Modifications non enregistrées</span>}
        <button onClick={enregistrer} disabled={sauv === 'loading'} style={{ ...btnPrim, padding: '11px 22px', fontSize: 14 }}>{sauv === 'loading' ? 'Enregistrement…' : '💾 Enregistrer'}</button>
      </div>
    </div>
  );
}

// ─── Aperçu réduit du template (sans siteId : chiffres de démonstration, aucun vrai don possible) ───
function Apercu({ cfg, largeurBoite }: { cfg: ConfigCagnotte; largeurBoite: number }) {
  const echelle = largeurBoite / 420;
  return (
    <div style={{ width: largeurBoite, height: 640 * echelle * 1.0, overflow: 'hidden', border: '1px solid #e5e7eb', borderRadius: 14, background: '#fff', marginTop: 8, position: 'relative' }}>
      <div style={{ width: 420, height: 640 / echelle * 1, transform: `scale(${echelle})`, transformOrigin: 'top left', overflowY: 'auto', overflowX: 'hidden', pointerEvents: 'none' }}>
        <TemplateCagnotteClassique config={cfg} isPreviewMobile />
      </div>
    </div>
  );
}

// ─── Petits composants de formulaire ───
function Champ({ label, aide: texteAide, children, flex }: { label: string; aide?: string; children: React.ReactNode; flex?: boolean }) {
  return (
    <div style={{ marginBottom: 16, ...(flex ? { flex: 1, minWidth: 180 } : {}) }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</label>
      {children}
      {texteAide && <p style={{ ...aide, marginTop: 5 }}>{texteAide}</p>}
    </div>
  );
}
const Texte = ({ v, on, max, placeholder }: { v: string; on: (v: string) => void; max: number; placeholder?: string }) => <input style={champ} value={v || ''} maxLength={max} placeholder={placeholder} onChange={e => on(e.target.value)} />;
const Zone = ({ v, on, max, rows }: { v: string; on: (v: string) => void; max: number; rows: number }) => <textarea style={{ ...champ, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }} rows={rows} value={v || ''} maxLength={max} onChange={e => on(e.target.value)} />;
function Couleur({ label, v, on }: { label: string; v: string; on: (v: string) => void }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 6 }}>{label}</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(v) ? v : '#000000'} onChange={e => on(e.target.value)} style={{ width: 44, height: 36, border: '1px solid #d1d5db', borderRadius: 8, padding: 2, background: '#fff' }} />
        <input style={{ ...champ, flex: 1 }} value={v} maxLength={7} onChange={e => on(e.target.value)} />
      </div>
    </div>
  );
}

const carte: React.CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 20px 8px' };
const champ: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#1a1a1a' };
const aide: React.CSSProperties = { fontSize: 12, color: '#888', margin: '0 0 10px', lineHeight: 1.5 };
const alerte: React.CSSProperties = { fontSize: 12.5, color: '#b45309', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '8px 10px', margin: '-6px 0 14px' };
const btnPrim: React.CSSProperties = { background: '#c9a96e', border: 'none', color: '#fff', borderRadius: 9, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' };
const btnSec: React.CSSProperties = { background: '#fff', border: '1px solid #d1d5db', color: '#374151', borderRadius: 9, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' };
const btnX: React.CSSProperties = { background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: 8, width: 38, cursor: 'pointer' };
const btnOnglet: React.CSSProperties = { background: '#fff', border: '1.5px solid #e5e7eb', color: '#374151', borderRadius: 20, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' };
const btnOngletActif: React.CSSProperties = { background: '#1a1a1a', borderColor: '#1a1a1a', color: '#fff' };