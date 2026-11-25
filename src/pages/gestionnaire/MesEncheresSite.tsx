// src/pages/gestionnaire/MesEncheresSite.tsx
// e-Vend Studio — Gestionnaire : « Mes enchères » pour les sites Enchère Galerie / Enchère Live.
// Lots (création, modification, annulation, gagnants, paiement), apparence (sites.config.enchere) et réglages.

import { useState, useEffect, useCallback } from 'react';

interface Props { gestionnaireId: number; templateId?: string; }

interface LotG {
  id: number; titre: string; description: string; photos: string[]; categorie: string; condition: string; tags: string[]; vedette: boolean;
  prixBase: number; prixReserve: number | null; increment: number | null; dateDebut: string; dateFin: string; statut: string;
  prixActuel: number | null; prixFinal: number | null; nbMises: number; maximumMeneur: number | null;
  meneur: { prenom: string; email: string } | null; gagnant: { prenom: string; email: string } | null;
  paiementStatut: string; reserveAtteinte: boolean | null;
}
interface Reglages { verification_courriel: boolean; prolongation_min: number; notifier_gestionnaire: boolean; }
interface MiseG { montant: number; auto: boolean; date: string; prenom: string; email: string; }

const API = '/api/studio/encheres-site';
const entetes = (): HeadersInit => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` });
const argent = (n: number | null | undefined) => (n == null ? '—' : new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n));
const quand = (iso: string) => new Date(iso).toLocaleString('fr-CA', { dateStyle: 'medium', timeStyle: 'short' });
const versLocal = (iso?: string) => { const d = iso ? new Date(iso) : new Date(); const p = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };

async function appel(url: string, init?: RequestInit) {
  const r = await fetch(url, { ...init, headers: entetes(), credentials: 'include' });
  let d: any = {}; try { d = await r.json(); } catch { /* ignore */ }
  if (!r.ok) throw new Error(d.message || 'Erreur.');
  return d;
}

const carte: React.CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 18 };
const champ: React.CSSProperties = { width: '100%', padding: '9px 11px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff', color: '#111827' };
const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 };
const btn = (couleur = '#4f46e5', plein = true): React.CSSProperties => ({ padding: '8px 14px', borderRadius: 8, border: plein ? 'none' : `1px solid ${couleur}`, background: plein ? couleur : '#fff', color: plein ? '#fff' : couleur, fontWeight: 700, fontSize: 13, cursor: 'pointer' });

const STATUTS: Record<string, { t: string; c: string }> = {
  active: { t: 'En cours', c: '#16a34a' }, terminee: { t: 'Vendu', c: '#2563eb' }, sans_gagnant: { t: 'Sans gagnant', c: '#6b7280' }, annulee: { t: 'Annulé', c: '#dc2626' },
};

const VIDE = { titre: '', description: '', photos: '', categorie: '', condition: '', prixBase: '', prixReserve: '', increment: '', dateDebut: '', dateFin: '', vedette: false };

function ChampTexte({ label, valeur, onChange, type = 'text', aide, placeholder }: { label: string; valeur: string; onChange: (v: string) => void; type?: string; aide?: string; placeholder?: string }) {
  return (<div style={{ marginBottom: 12 }}><label style={lbl}>{label}</label><input type={type} style={champ} value={valeur} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />{aide && <p style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>{aide}</p>}</div>);
}

export default function MesEncheresSite({ gestionnaireId, templateId }: Props) {
  const estLive = templateId === 'enchere-live';
  const [onglet, setOnglet] = useState<'lots' | 'apparence' | 'reglages'>('lots');
  const [lots, setLots] = useState<LotG[]>([]);
  const [chargement, setChargement] = useState(true);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [form, setForm] = useState<typeof VIDE | null>(null);
  const [edition, setEdition] = useState<LotG | null>(null);
  const [mises, setMises] = useState<{ lot: LotG; liste: MiseG[] } | null>(null);
  const [cfg, setCfg] = useState<Record<string, string>>({});
  const [rg, setRg] = useState<Reglages>({ verification_courriel: true, prolongation_min: 2, notifier_gestionnaire: true });
  const [occupe, setOccupe] = useState(false);

  const flash = (ok: boolean, t: string) => { setMsg({ ok, t }); setTimeout(() => setMsg(null), 4000); };

  const charger = useCallback(async () => {
    try { const d = await appel(`${API}/lots`); setLots(d.lots || []); } catch (e: any) { flash(false, e.message); } finally { setChargement(false); }
  }, []);

  useEffect(() => {
    charger();
    appel(`${API}/reglages`).then(setRg).catch(() => {});
    fetch(`/api/studio/sites/${gestionnaireId}`, { headers: entetes(), credentials: 'include' }).then((r) => (r.ok ? r.json() : null))
      .then((d) => { const c = d && d.config && d.config.enchere; if (c && typeof c === 'object') setCfg(c); }).catch(() => {});
  }, [charger, gestionnaireId]);

  const ouvrirNouveau = () => { setEdition(null); setForm({ ...VIDE, dateDebut: versLocal(), dateFin: versLocal(new Date(Date.now() + 7 * 86400000).toISOString()) }); };
  const ouvrirEdition = (l: LotG) => {
    setEdition(l);
    setForm({ titre: l.titre, description: l.description, photos: l.photos.join('\n'), categorie: l.categorie, condition: l.condition, prixBase: String(l.prixBase), prixReserve: l.prixReserve != null ? String(l.prixReserve) : '', increment: l.increment != null ? String(l.increment) : '', dateDebut: versLocal(l.dateDebut), dateFin: versLocal(l.dateFin), vedette: l.vedette });
  };

  const enregistrer = async () => {
    if (!form) return;
    setOccupe(true);
    try {
      const corps = {
        titre: form.titre, description: form.description, categorie: form.categorie, condition: form.condition, vedette: form.vedette,
        photos: form.photos.split('\n').map((s) => s.trim()).filter(Boolean), prixBase: form.prixBase, prixReserve: form.prixReserve, increment: form.increment,
        dateDebut: form.dateDebut ? new Date(form.dateDebut).toISOString() : undefined, dateFin: form.dateFin ? new Date(form.dateFin).toISOString() : '',
      };
      if (edition) await appel(`${API}/lots/${edition.id}`, { method: 'PUT', body: JSON.stringify(corps) });
      else await appel(`${API}/lots`, { method: 'POST', body: JSON.stringify(corps) });
      setForm(null); setEdition(null); flash(true, edition ? 'Lot modifié.' : 'Lot ajouté. Il est visible sur votre site.'); charger();
    } catch (e: any) { flash(false, e.message); } finally { setOccupe(false); }
  };

  const action = async (fn: () => Promise<any>, ok: string) => { try { await fn(); flash(true, ok); charger(); } catch (e: any) { flash(false, e.message); } };

  const sauverApparence = async () => {
    setOccupe(true);
    try {
      await appel(`/api/studio/sites/${gestionnaireId}/config`, { method: 'PUT', body: JSON.stringify({ config: { enchere: cfg }, template_id: estLive ? 'enchere-live' : 'enchere-galerie' }) });
      flash(true, 'Apparence enregistrée.');
    } catch (e: any) { flash(false, e.message); } finally { setOccupe(false); }
  };
  const sauverReglages = async () => {
    setOccupe(true);
    try { setRg(await appel(`${API}/reglages`, { method: 'PUT', body: JSON.stringify(rg) })); flash(true, 'Réglages enregistrés.'); } catch (e: any) { flash(false, e.message); } finally { setOccupe(false); }
  };
  const c = (k: string) => cfg[k] || '';
  const sc = (k: string) => (v: string) => setCfg((p) => ({ ...p, [k]: v }));

  const enCours = lots.filter((l) => l.statut === 'active');
  const aPayer = lots.filter((l) => l.statut === 'terminee' && l.paiementStatut !== 'payee');

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '8px 4px 60px', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#111827' }}>🔨 Mes enchères</h2>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>{enCours.length} lot{enCours.length !== 1 ? 's' : ''} en cours{aPayer.length ? ` · ${aPayer.length} à encaisser` : ''}</p>
        </div>
        {onglet === 'lots' && <button style={btn()} onClick={ouvrirNouveau}>＋ Ajouter un lot</button>}
      </div>

      {msg && <div style={{ background: msg.ok ? '#dcfce7' : '#fee2e2', color: msg.ok ? '#166534' : '#991b1b', padding: '10px 14px', borderRadius: 10, fontSize: 14, marginBottom: 12 }}>{msg.t}</div>}

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {([['lots', '📦 Mes lots'], ['apparence', '🎨 Apparence'], ['reglages', '⚙️ Réglages']] as const).map(([id, l]) => (
          <button key={id} onClick={() => setOnglet(id)} style={{ padding: '8px 16px', borderRadius: 20, border: '1px solid ' + (onglet === id ? '#4f46e5' : '#d1d5db'), background: onglet === id ? '#4f46e5' : '#fff', color: onglet === id ? '#fff' : '#374151', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{l}</button>
        ))}
      </div>

      {onglet === 'lots' && (
        chargement ? <p style={{ color: '#6b7280' }}>Chargement…</p> : lots.length === 0 ? (
          <div style={{ ...carte, textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 44 }}>🔨</div>
            <p style={{ fontWeight: 700, margin: '8px 0 4px' }}>Aucun lot pour l'instant</p>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>Ajoutez votre premier lot : il apparaîtra tout de suite sur votre site, prêt à recevoir des mises.</p>
            <button style={btn()} onClick={ouvrirNouveau}>＋ Ajouter un lot</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {lots.map((l) => {
              const st = STATUTS[l.statut] || { t: l.statut, c: '#6b7280' };
              const aVenir = l.statut === 'active' && new Date(l.dateDebut).getTime() > Date.now();
              return (
                <div key={l.id} style={{ ...carte, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ width: 96, height: 76, borderRadius: 10, background: '#f3f4f6', overflow: 'hidden', flexShrink: 0 }}>
                    {l.photos[0] ? <img src={l.photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ textAlign: 'center', lineHeight: '76px', fontSize: 26 }}>📦</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: 15, color: '#111827' }}>{l.titre}</strong>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: aVenir ? '#d97706' : st.c, padding: '2px 8px', borderRadius: 20 }}>{aVenir ? 'À venir' : st.t}</span>
                      {l.statut === 'terminee' && <span style={{ fontSize: 11, fontWeight: 800, color: l.paiementStatut === 'payee' ? '#166534' : '#92400e', background: l.paiementStatut === 'payee' ? '#dcfce7' : '#fef3c7', padding: '2px 8px', borderRadius: 20 }}>{l.paiementStatut === 'payee' ? 'Payé' : l.paiementStatut === 'non_payee' ? 'Non payé' : 'À encaisser'}</span>}
                    </div>
                    <p style={{ fontSize: 13, color: '#4b5563', margin: '6px 0 0' }}>
                      Départ {argent(l.prixBase)}{l.prixReserve != null ? ` · Réserve ${argent(l.prixReserve)} ${l.reserveAtteinte ? '✅ atteinte' : '🔒 non atteinte'}` : ''}
                    </p>
                    <p style={{ fontSize: 13, color: '#111827', margin: '3px 0 0', fontWeight: 600 }}>
                      {l.statut === 'terminee' ? `Vendu ${argent(l.prixFinal)}` : `Prix actuel ${argent(l.nbMises ? l.prixActuel : l.prixBase)}`} · {l.nbMises} mise{l.nbMises !== 1 ? 's' : ''}
                    </p>
                    {l.statut === 'active' && l.meneur && <p style={{ fontSize: 12, color: '#4b5563', margin: '3px 0 0' }}>En tête : {l.meneur.prenom} ({l.meneur.email}) — maximum {argent(l.maximumMeneur)}</p>}
                    {l.statut === 'terminee' && l.gagnant && <p style={{ fontSize: 13, color: '#1d4ed8', margin: '3px 0 0', fontWeight: 600 }}>🏆 {l.gagnant.prenom} — <a href={`mailto:${l.gagnant.email}`} style={{ color: '#1d4ed8' }}>{l.gagnant.email}</a></p>}
                    <p style={{ fontSize: 12, color: '#6b7280', margin: '3px 0 0' }}>{l.statut === 'active' ? 'Fin' : 'Terminé'} : {quand(l.statut === 'active' ? l.dateFin : (l.dateFin))}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 130 }}>
                    {l.statut === 'active' && <button style={btn('#4f46e5', false)} onClick={() => ouvrirEdition(l)}>✏️ Modifier</button>}
                    {l.nbMises > 0 && <button style={btn('#0f766e', false)} onClick={async () => { try { const d = await appel(`${API}/lots/${l.id}/mises`); setMises({ lot: l, liste: d.mises || [] }); } catch (e: any) { flash(false, e.message); } }}>📜 Voir les mises</button>}
                    {l.statut === 'terminee' && l.paiementStatut !== 'payee' && <button style={btn('#16a34a')} onClick={() => action(() => appel(`${API}/lots/${l.id}/paiement`, { method: 'POST', body: JSON.stringify({ statut: 'payee' }) }), 'Marqué comme payé.')}>💰 Marquer payé</button>}
                    {l.statut === 'terminee' && l.paiementStatut === 'a_payer' && <button style={btn('#b45309', false)} onClick={() => action(() => appel(`${API}/lots/${l.id}/paiement`, { method: 'POST', body: JSON.stringify({ statut: 'non_payee' }) }), 'Marqué comme non payé.')}>Non payé</button>}
                    {l.statut === 'active' && <button style={btn('#dc2626', false)} onClick={() => { if (window.confirm(`Annuler « ${l.titre} » ? Les enchérisseurs ne pourront plus miser.`)) action(() => appel(`${API}/lots/${l.id}/annuler`, { method: 'POST' }), 'Lot annulé.'); }}>Annuler</button>}
                    {l.nbMises === 0 && l.statut !== 'terminee' && <button style={btn('#6b7280', false)} onClick={() => { if (window.confirm('Supprimer définitivement ce lot ?')) action(() => appel(`${API}/lots/${l.id}`, { method: 'DELETE' }), 'Lot supprimé.'); }}>🗑 Supprimer</button>}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {onglet === 'apparence' && (
        <div style={carte}>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 0 }}>Personnalisez l'allure de votre site d'enchères. Les lots se gèrent dans l'onglet « Mes lots ».</p>
          <ChampTexte label="Nom de votre maison / boutique" valeur={c('nomBoutique')} onChange={sc('nomBoutique')} placeholder={estLive ? 'LiveBid Studio' : 'Maison des Enchères'} />
          <ChampTexte label="Titre de la vente" valeur={c('nomVente')} onChange={sc('nomVente')} placeholder="Vente de prestige — Juin" />
          <div style={{ marginBottom: 12 }}><label style={lbl}>Description de la vente</label><textarea style={{ ...champ, minHeight: 80 }} value={c('descriptionVente')} onChange={(e) => sc('descriptionVente')(e.target.value)} /></div>
          <ChampTexte label="Logo (adresse https://…)" valeur={c('logoUrl')} onChange={sc('logoUrl')} />
          {!estLive && <ChampTexte label="Image de bannière (adresse https://…)" valeur={c('banniereUrl')} onChange={sc('banniereUrl')} />}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 12 }}>
            {(estLive ? [['couleurPrimaire', 'Couleur principale', '#6366f1'], ['couleurAccent', 'Couleur d\'accent', '#f472b6'], ['couleurFond', 'Couleur de fond', '#030712']] : [['couleurPrincipale', 'Couleur principale', '#c9a96e'], ['couleurSecondaire', 'Couleur de fond', '#0f0c0c']]).map(([k, l, d]) => (
              <div key={k}><label style={lbl}>{l}</label><input type="color" style={{ ...champ, padding: 3, height: 40 }} value={/^#[0-9a-fA-F]{6}$/.test(c(k)) ? c(k) : d} onChange={(e) => sc(k)(e.target.value)} /></div>
            ))}
          </div>
          {!estLive && <div style={{ marginBottom: 12 }}><label style={lbl}>Police</label><select style={champ} value={c('police') || 'classique'} onChange={(e) => sc('police')(e.target.value)}><option value="classique">Classique (élégante)</option><option value="moderne">Moderne</option></select></div>}
          <ChampTexte label={estLive ? "Nom de l'organisateur" : 'Nom du vendeur'} valeur={c(estLive ? 'nomOrganisateur' : 'nomVendeur')} onChange={sc(estLive ? 'nomOrganisateur' : 'nomVendeur')} />
          <ChampTexte label="Courriel de contact" type="email" valeur={c('email')} onChange={sc('email')} />
          <ChampTexte label="Téléphone" valeur={c('telephone')} onChange={sc('telephone')} />
          <button style={btn()} disabled={occupe} onClick={sauverApparence}>{occupe ? '⏳' : 'Enregistrer'}</button>
        </div>
      )}

      {onglet === 'reglages' && (
        <div style={carte}>
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 16, cursor: 'pointer' }}>
            <input type="checkbox" checked={rg.verification_courriel} onChange={(e) => setRg({ ...rg, verification_courriel: e.target.checked })} style={{ marginTop: 3 }} />
            <span><strong style={{ fontSize: 14 }}>Vérifier le courriel des enchérisseurs (recommandé)</strong><br /><span style={{ fontSize: 12, color: '#6b7280' }}>Un code à 6 chiffres est envoyé avant la première mise. Évite les fausses mises et garantit que le gagnant est joignable. Si vous décochez, n'importe qui peut miser avec un courriel non vérifié.</span></span>
          </label>
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Prolongation automatique (anti-« sniping »)</label>
            <select style={{ ...champ, maxWidth: 260 }} value={rg.prolongation_min} onChange={(e) => setRg({ ...rg, prolongation_min: parseInt(e.target.value, 10) })}>
              <option value={0}>Désactivée</option><option value={1}>1 minute</option><option value={2}>2 minutes (défaut)</option><option value={3}>3 minutes</option><option value={5}>5 minutes</option><option value={10}>10 minutes</option>
            </select>
            <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Si une mise arrive dans les dernières minutes, l'enchère est prolongée de ce délai pour laisser les autres réagir.</p>
          </div>
          <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, cursor: 'pointer' }}>
            <input type="checkbox" checked={rg.notifier_gestionnaire} onChange={(e) => setRg({ ...rg, notifier_gestionnaire: e.target.checked })} />
            <span style={{ fontSize: 14 }}>Me prévenir par courriel à la fin de chaque enchère (gagnant, prix final)</span>
          </label>
          <button style={btn()} disabled={occupe} onClick={sauverReglages}>{occupe ? '⏳' : 'Enregistrer'}</button>
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, marginTop: 22, fontSize: 13, color: '#4b5563', lineHeight: 1.6 }}>
            <strong>Comment ça marche</strong><br />
            • Le visiteur entre le <em>maximum</em> qu'il accepte de payer ; le système mise pour lui, un incrément à la fois, seulement quand c'est nécessaire.<br />
            • Le prix de réserve reste secret : les visiteurs voient seulement « atteinte » ou « non atteinte ». Sous la réserve, le lot n'est pas vendu.<br />
            • À la fin, le gagnant et vous recevez un courriel. Le paiement se règle directement entre vous et lui ; marquez ensuite le lot « payé ».<br />
            • Dès qu'une mise est placée, le prix de départ, la réserve et l'incrément sont verrouillés (équité envers les enchérisseurs).
          </div>
        </div>
      )}

      {form && (
        <div onClick={() => !occupe && setForm(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 620, maxHeight: '92vh', overflow: 'auto', padding: 22 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 18 }}>{edition ? 'Modifier le lot' : 'Nouveau lot'}</h3>
            {edition && edition.nbMises > 0 && <div style={{ background: '#fef3c7', color: '#92400e', padding: '8px 12px', borderRadius: 8, fontSize: 12, marginBottom: 12 }}>Des mises ont été placées : prix de départ, réserve, incrément et début sont verrouillés. Vous pouvez seulement prolonger la fin.</div>}
            <ChampTexte label="Titre *" valeur={form.titre} onChange={(v) => setForm({ ...form, titre: v })} />
            <div style={{ marginBottom: 12 }}><label style={lbl}>Description</label><textarea style={{ ...champ, minHeight: 90 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div style={{ marginBottom: 12 }}><label style={lbl}>Photos (une adresse https:// par ligne, max 8)</label><textarea style={{ ...champ, minHeight: 70 }} value={form.photos} onChange={(e) => setForm({ ...form, photos: e.target.value })} placeholder="https://…/photo1.jpg" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <ChampTexte label="Catégorie" valeur={form.categorie} onChange={(v) => setForm({ ...form, categorie: v })} placeholder="Montres, Art…" />
              <ChampTexte label="État" valeur={form.condition} onChange={(v) => setForm({ ...form, condition: v })} placeholder="Excellent, Neuf…" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
              <ChampTexte label="Prix de départ ($) *" type="number" valeur={form.prixBase} onChange={(v) => setForm({ ...form, prixBase: v })} />
              <ChampTexte label="Prix de réserve ($)" type="number" valeur={form.prixReserve} onChange={(v) => setForm({ ...form, prixReserve: v })} aide="Secret. Optionnel." />
              <ChampTexte label="Incrément ($)" type="number" valeur={form.increment} onChange={(v) => setForm({ ...form, increment: v })} aide="Vide = automatique." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
              <ChampTexte label="Début" type="datetime-local" valeur={form.dateDebut} onChange={(v) => setForm({ ...form, dateDebut: v })} />
              <ChampTexte label="Fin *" type="datetime-local" valeur={form.dateFin} onChange={(v) => setForm({ ...form, dateFin: v })} />
            </div>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, marginBottom: 16, cursor: 'pointer' }}><input type="checkbox" checked={form.vedette} onChange={(e) => setForm({ ...form, vedette: e.target.checked })} /> ⭐ Mettre en vedette</label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={btn('#6b7280', false)} disabled={occupe} onClick={() => setForm(null)}>Fermer</button>
              <button style={btn()} disabled={occupe} onClick={enregistrer}>{occupe ? '⏳' : edition ? 'Enregistrer' : 'Ajouter le lot'}</button>
            </div>
          </div>
        </div>
      )}

      {mises && (
        <div onClick={() => setMises(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '88vh', overflow: 'auto', padding: 22 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 17 }}>Mises — {mises.lot.titre}</h3>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead><tr style={{ textAlign: 'left', color: '#6b7280' }}><th style={{ padding: 6 }}>Date</th><th>Enchérisseur</th><th style={{ textAlign: 'right' }}>Montant</th></tr></thead>
              <tbody>{mises.liste.map((m, i) => (
                <tr key={i} style={{ borderTop: '1px solid #f3f4f6' }}><td style={{ padding: 6 }}>{quand(m.date)}</td><td>{m.prenom} <span style={{ color: '#6b7280' }}>({m.email})</span>{m.auto ? ' · auto' : ''}</td><td style={{ textAlign: 'right', fontWeight: 700 }}>{argent(m.montant)}</td></tr>
              ))}</tbody>
            </table>
            <div style={{ textAlign: 'right', marginTop: 14 }}><button style={btn('#6b7280', false)} onClick={() => setMises(null)}>Fermer</button></div>
          </div>
        </div>
      )}
    </div>
  );
}