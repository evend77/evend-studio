// src/pages/gestionnaire/MesAnnoncesSite.tsx
// e-Vend Studio — Gestionnaire : « Mes annonces » (sites de petites annonces — affichage seulement).
// Annonces (créer, modifier, renouveler, marquer vendue, archiver), messages reçus, apparence (sites.config.annonces) et réglages.

import { useState, useEffect, useCallback } from 'react';

interface Props { gestionnaireId: number; templateId?: string; }

interface AnnonceG {
  id: number; titre: string; description: string; prix: number | null; prixTexte: string; categorie: string; lieu: string; photos: string[];
  details: Record<string, string>; vedette: boolean; statut: string; datePublication: string; dateExpiration: string | null;
  vues: number; nbMessages: number; nbNonLus: number;
}
interface MessageG { id: number; annonceId: number; annonce: string; nom: string; email: string; telephone: string; message: string; lu: boolean; date: string; }
interface Reglages { duree_defaut_jours: number; notifier_messages: boolean; }

const API = '/api/studio/annonces-site';
const entetes = (): HeadersInit => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` });
async function appel(url: string, init?: RequestInit) {
  const r = await fetch(url, { ...init, headers: entetes(), credentials: 'include' });
  let d: any = {}; try { d = await r.json(); } catch { /* ignore */ }
  if (!r.ok) throw new Error(d.message || 'Erreur.');
  return d;
}
const argent = (n: number | null) => (n == null ? '' : new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n));
const quand = (iso: string) => new Date(iso).toLocaleString('fr-CA', { dateStyle: 'medium', timeStyle: 'short' });
const jour = (iso: string) => new Date(iso).toLocaleDateString('fr-CA', { dateStyle: 'medium' });

const carte: React.CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 18 };
const champ: React.CSSProperties = { width: '100%', padding: '9px 11px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff', color: '#111827' };
const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 };
const btn = (c = '#0f766e', plein = true): React.CSSProperties => ({ padding: '8px 14px', borderRadius: 8, border: plein ? 'none' : `1px solid ${c}`, background: plein ? c : '#fff', color: plein ? '#fff' : c, fontWeight: 700, fontSize: 13, cursor: 'pointer' });

const STATUTS: Record<string, { t: string; c: string }> = {
  active: { t: 'En ligne', c: '#16a34a' }, expiree: { t: 'Expirée', c: '#d97706' }, vendue: { t: 'Vendue / terminée', c: '#2563eb' }, archivee: { t: 'Masquée', c: '#6b7280' },
};

const VIDE = { titre: '', description: '', prix: '', prixTexte: '', categorie: '', lieu: '', photos: '', details: '', vedette: false, dureeJours: '' };
const detailsVersTexte = (d: Record<string, string>) => Object.entries(d || {}).map(([k, v]) => `${k} : ${v}`).join('\n');
const texteVersDetails = (t: string) => { const o: Record<string, string> = {}; t.split('\n').forEach((l) => { const i = l.indexOf(':'); if (i > 0) { const k = l.slice(0, i).trim(), v = l.slice(i + 1).trim(); if (k && v) o[k] = v; } }); return o; };

function Champ({ label, valeur, onChange, type = 'text', aide, placeholder }: { label: string; valeur: string; onChange: (v: string) => void; type?: string; aide?: string; placeholder?: string }) {
  return (<div style={{ marginBottom: 12 }}><label style={lbl}>{label}</label><input type={type} style={champ} value={valeur} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />{aide && <p style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>{aide}</p>}</div>);
}

export default function MesAnnoncesSite({ gestionnaireId, templateId }: Props) {
  const [onglet, setOnglet] = useState<'annonces' | 'messages' | 'apparence' | 'reglages'>('annonces');
  const [liste, setListe] = useState<AnnonceG[]>([]);
  const [messages, setMessages] = useState<MessageG[]>([]);
  const [chargement, setChargement] = useState(true);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [form, setForm] = useState<typeof VIDE | null>(null);
  const [edition, setEdition] = useState<AnnonceG | null>(null);
  const [cfg, setCfg] = useState<Record<string, string>>({});
  const [rg, setRg] = useState<Reglages>({ duree_defaut_jours: 30, notifier_messages: true });
  const [occupe, setOccupe] = useState(false);
  const [filtre, setFiltre] = useState<'toutes' | 'active' | 'expiree' | 'vendue' | 'archivee'>('toutes');

  const flash = (ok: boolean, t: string) => { setMsg({ ok, t }); setTimeout(() => setMsg(null), 4000); };

  const charger = useCallback(async () => {
    try {
      const [a, m] = await Promise.all([appel(`${API}/annonces`), appel(`${API}/messages`)]);
      setListe(a.annonces || []); setMessages(m.messages || []);
    } catch (e: any) { flash(false, e.message); } finally { setChargement(false); }
  }, []);

  useEffect(() => {
    charger();
    appel(`${API}/reglages`).then(setRg).catch(() => {});
    fetch(`/api/studio/sites/${gestionnaireId}`, { headers: entetes(), credentials: 'include' }).then((r) => (r.ok ? r.json() : null))
      .then((d) => { const c = d && d.config && d.config.annonces; if (c && typeof c === 'object') setCfg(c); }).catch(() => {});
  }, [charger, gestionnaireId]);

  const categoriesConnues = Array.from(new Set(liste.map((a) => a.categorie).filter(Boolean)));
  const nonLus = messages.filter((m) => !m.lu).length;

  const nouveau = () => { setEdition(null); setForm({ ...VIDE, dureeJours: String(rg.duree_defaut_jours) }); };
  const modifier = (a: AnnonceG) => { setEdition(a); setForm({ titre: a.titre, description: a.description, prix: a.prix != null ? String(a.prix) : '', prixTexte: a.prixTexte, categorie: a.categorie, lieu: a.lieu, photos: a.photos.join('\n'), details: detailsVersTexte(a.details), vedette: a.vedette, dureeJours: '' }); };

  const enregistrer = async () => {
    if (!form) return;
    setOccupe(true);
    try {
      const corps: any = { titre: form.titre, description: form.description, prix: form.prix, prixTexte: form.prixTexte, categorie: form.categorie, lieu: form.lieu, vedette: form.vedette,
        photos: form.photos.split('\n').map((s) => s.trim()).filter(Boolean), details: texteVersDetails(form.details) };
      if (edition) await appel(`${API}/annonces/${edition.id}`, { method: 'PUT', body: JSON.stringify(corps) });
      else { corps.dureeJours = form.dureeJours; await appel(`${API}/annonces`, { method: 'POST', body: JSON.stringify(corps) }); }
      setForm(null); setEdition(null); flash(true, edition ? 'Annonce modifiée.' : 'Annonce publiée. Elle est en ligne sur votre site.'); charger();
    } catch (e: any) { flash(false, e.message); } finally { setOccupe(false); }
  };

  const action = async (fn: () => Promise<any>, ok: string) => { try { await fn(); flash(true, ok); charger(); } catch (e: any) { flash(false, e.message); } };
  const statut = (a: AnnonceG, s: string, ok: string) => action(() => appel(`${API}/annonces/${a.id}/statut`, { method: 'POST', body: JSON.stringify({ statut: s }) }), ok);

  const sauverApparence = async () => {
    setOccupe(true);
    try { await appel(`/api/studio/sites/${gestionnaireId}/config`, { method: 'PUT', body: JSON.stringify({ config: { annonces: cfg }, template_id: templateId || 'annonces-classique' }) }); flash(true, 'Apparence enregistrée.'); }
    catch (e: any) { flash(false, e.message); } finally { setOccupe(false); }
  };
  const sauverReglages = async () => {
    setOccupe(true);
    try { setRg(await appel(`${API}/reglages`, { method: 'PUT', body: JSON.stringify(rg) })); flash(true, 'Réglages enregistrés.'); } catch (e: any) { flash(false, e.message); } finally { setOccupe(false); }
  };
  const sc = (k: string) => (v: string) => setCfg((p) => ({ ...p, [k]: v }));
  const c = (k: string) => cfg[k] || '';

  const visibles = liste.filter((a) => filtre === 'toutes' || a.statut === filtre);
  const nbActives = liste.filter((a) => a.statut === 'active').length;
  const nbExpirees = liste.filter((a) => a.statut === 'expiree').length;

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '8px 4px 60px', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#111827' }}>📋 Mes annonces</h2>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>{nbActives} en ligne{nbExpirees ? ` · ${nbExpirees} expirée${nbExpirees > 1 ? 's' : ''}` : ''}{nonLus ? ` · ${nonLus} message${nonLus > 1 ? 's' : ''} non lu${nonLus > 1 ? 's' : ''}` : ''}</p>
        </div>
        {onglet === 'annonces' && <button style={btn()} onClick={nouveau}>＋ Nouvelle annonce</button>}
      </div>

      {msg && <div style={{ background: msg.ok ? '#dcfce7' : '#fee2e2', color: msg.ok ? '#166534' : '#991b1b', padding: '10px 14px', borderRadius: 10, fontSize: 14, marginBottom: 12 }}>{msg.t}</div>}

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {([['annonces', '📋 Annonces'], ['messages', `✉️ Messages${nonLus ? ` (${nonLus})` : ''}`], ['apparence', '🎨 Apparence'], ['reglages', '⚙️ Réglages']] as const).map(([id, l]) => (
          <button key={id} onClick={() => setOnglet(id)} style={{ padding: '8px 16px', borderRadius: 20, border: '1px solid ' + (onglet === id ? '#0f766e' : '#d1d5db'), background: onglet === id ? '#0f766e' : '#fff', color: onglet === id ? '#fff' : '#374151', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{l}</button>
        ))}
      </div>

      {onglet === 'annonces' && (
        chargement ? <p style={{ color: '#6b7280' }}>Chargement…</p> : liste.length === 0 ? (
          <div style={{ ...carte, textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 44 }}>📋</div>
            <p style={{ fontWeight: 700, margin: '8px 0 4px' }}>Aucune annonce pour l'instant</p>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>Publiez votre première annonce : elle apparaîtra tout de suite sur votre site.</p>
            <button style={btn()} onClick={nouveau}>＋ Nouvelle annonce</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {([['toutes', 'Toutes'], ['active', 'En ligne'], ['expiree', 'Expirées'], ['vendue', 'Vendues'], ['archivee', 'Masquées']] as const).map(([id, l]) => (
                <button key={id} onClick={() => setFiltre(id)} style={{ padding: '5px 12px', borderRadius: 16, border: '1px solid ' + (filtre === id ? '#0f766e' : '#d1d5db'), background: filtre === id ? '#ccfbf1' : '#fff', color: filtre === id ? '#0f766e' : '#4b5563', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>{l}</button>
              ))}
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {visibles.map((a) => {
                const st = STATUTS[a.statut] || { t: a.statut, c: '#6b7280' };
                return (
                  <div key={a.id} style={{ ...carte, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    <div style={{ width: 96, height: 76, borderRadius: 10, background: '#f3f4f6', overflow: 'hidden', flexShrink: 0 }}>
                      {a.photos[0] ? <img src={a.photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ textAlign: 'center', lineHeight: '76px', fontSize: 26 }}>📷</div>}
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: 15, color: '#111827' }}>{a.titre}</strong>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: st.c, padding: '2px 8px', borderRadius: 20 }}>{st.t}</span>
                        {a.vedette && <span style={{ fontSize: 11, fontWeight: 800, color: '#92400e', background: '#fef3c7', padding: '2px 8px', borderRadius: 20 }}>⭐ Vedette</span>}
                      </div>
                      <p style={{ fontSize: 13, color: '#4b5563', margin: '5px 0 0' }}>{a.prix != null ? argent(a.prix) : (a.prixTexte || 'Prix à discuter')}{a.categorie ? ` · ${a.categorie}` : ''}{a.lieu ? ` · 📍 ${a.lieu}` : ''}</p>
                      <p style={{ fontSize: 12, color: '#6b7280', margin: '3px 0 0' }}>Publiée le {jour(a.datePublication)}{a.dateExpiration ? ` · ${a.statut === 'expiree' ? 'a expiré' : 'expire'} le ${jour(a.dateExpiration)}` : ' · sans expiration'} · 👁 {a.vues} · ✉️ {a.nbMessages}{a.nbNonLus ? ` (${a.nbNonLus} non lu${a.nbNonLus > 1 ? 's' : ''})` : ''}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 140 }}>
                      <button style={btn('#0f766e', false)} onClick={() => modifier(a)}>✏️ Modifier</button>
                      {(a.statut === 'expiree' || a.statut === 'vendue' || a.statut === 'archivee') && <button style={btn('#16a34a')} onClick={() => action(() => appel(`${API}/annonces/${a.id}/renouveler`, { method: 'POST', body: JSON.stringify({}) }), 'Annonce remise en ligne.')}>🔄 Remettre en ligne</button>}
                      {a.statut === 'active' && <button style={btn('#2563eb', false)} onClick={() => statut(a, 'vendue', 'Annonce marquée vendue (retirée du site).')}>✅ Marquer vendue</button>}
                      {a.statut === 'active' && <button style={btn('#6b7280', false)} onClick={() => statut(a, 'archivee', 'Annonce masquée.')}>🙈 Masquer</button>}
                      <button style={btn('#dc2626', false)} onClick={() => { if (window.confirm(`Supprimer « ${a.titre} » définitivement (et ses messages) ?`)) action(() => appel(`${API}/annonces/${a.id}`, { method: 'DELETE' }), 'Annonce supprimée.'); }}>🗑 Supprimer</button>
                    </div>
                  </div>
                );
              })}
              {visibles.length === 0 && <p style={{ color: '#6b7280', fontSize: 14 }}>Aucune annonce dans cette catégorie.</p>}
            </div>
          </>
        )
      )}

      {onglet === 'messages' && (
        messages.length === 0 ? <div style={{ ...carte, textAlign: 'center', color: '#6b7280' }}>Aucun message pour l'instant. Quand un visiteur vous écrit depuis une annonce, il apparaît ici et vous recevez aussi un courriel.</div> : (
          <div style={{ display: 'grid', gap: 10 }}>
            {messages.map((m) => (
              <div key={m.id} style={{ ...carte, borderLeft: `4px solid ${m.lu ? '#d1d5db' : '#0f766e'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 14 }}>{m.nom} <span style={{ fontWeight: 400, color: '#6b7280' }}>— {m.annonce}</span></strong>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>{quand(m.date)}</span>
                </div>
                <p style={{ fontSize: 13, margin: '4px 0', color: '#374151' }}><a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + m.annonce)}`} style={{ color: '#0f766e', fontWeight: 700 }}>{m.email}</a>{m.telephone ? ` · ${m.telephone}` : ''}</p>
                <p style={{ fontSize: 14, color: '#111827', whiteSpace: 'pre-wrap', margin: '8px 0' }}>{m.message}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + m.annonce)}`} style={{ ...btn(), textDecoration: 'none', display: 'inline-block' }}>↩ Répondre</a>
                  <button style={btn('#6b7280', false)} onClick={() => action(() => appel(`${API}/messages/${m.id}/lu`, { method: 'POST', body: JSON.stringify({ lu: !m.lu }) }), m.lu ? 'Marqué non lu.' : 'Marqué lu.')}>{m.lu ? 'Marquer non lu' : 'Marquer lu'}</button>
                  <button style={btn('#dc2626', false)} onClick={() => { if (window.confirm('Supprimer ce message ?')) action(() => appel(`${API}/messages/${m.id}`, { method: 'DELETE' }), 'Message supprimé.'); }}>Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {onglet === 'apparence' && (
        <div style={carte}>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 0 }}>Personnalisez l'allure de votre site. Les annonces se gèrent dans l'onglet « Annonces ».</p>
          <Champ label="Nom du site" valeur={c('nomSite')} onChange={sc('nomSite')} placeholder="Petites annonces" />
          <Champ label="Slogan (titre de la page d'accueil)" valeur={c('slogan')} onChange={sc('slogan')} placeholder="Trouvez de bonnes affaires près de chez vous" />
          <Champ label="Logo (adresse https://…)" valeur={c('logoUrl')} onChange={sc('logoUrl')} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 12 }}>
            <div><label style={lbl}>Couleur principale</label><input type="color" style={{ ...champ, padding: 3, height: 40 }} value={/^#[0-9a-fA-F]{6}$/.test(c('couleurPrincipale')) ? c('couleurPrincipale') : '#0f766e'} onChange={(e) => sc('couleurPrincipale')(e.target.value)} /></div>
            <div><label style={lbl}>Couleur de fond</label><input type="color" style={{ ...champ, padding: 3, height: 40 }} value={/^#[0-9a-fA-F]{6}$/.test(c('couleurFond')) ? c('couleurFond') : '#faf7f2'} onChange={(e) => sc('couleurFond')(e.target.value)} /></div>
          </div>
          <div style={{ marginBottom: 12 }}><label style={lbl}>Police</label><select style={champ} value={c('police') || 'classique'} onChange={(e) => sc('police')(e.target.value)}><option value="classique">Classique (avec empattements)</option><option value="moderne">Moderne</option></select></div>
          <div style={{ marginBottom: 12 }}><label style={lbl}>À propos (affiché en bas de page)</label><textarea style={{ ...champ, minHeight: 70 }} value={c('apropos')} onChange={(e) => sc('apropos')(e.target.value)} /></div>
          <Champ label="Courriel affiché en bas de page" type="email" valeur={c('email')} onChange={sc('email')} aide="Facultatif. Les messages des visiteurs arrivent à votre courriel de compte, même si vous laissez ceci vide." />
          <Champ label="Téléphone affiché en bas de page" valeur={c('telephone')} onChange={sc('telephone')} />
          <button style={btn()} disabled={occupe} onClick={sauverApparence}>{occupe ? '⏳' : 'Enregistrer'}</button>
        </div>
      )}

      {onglet === 'reglages' && (
        <div style={carte}>
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Durée d'affichage par défaut d'une annonce (jours)</label>
            <input type="number" min={0} max={365} style={{ ...champ, maxWidth: 160 }} value={rg.duree_defaut_jours} onChange={(e) => setRg({ ...rg, duree_defaut_jours: parseInt(e.target.value, 10) || 0 })} />
            <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Après ce délai, l'annonce disparaît du site (vous pouvez la remettre en ligne en un clic). 0 = sans expiration.</p>
          </div>
          <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, cursor: 'pointer' }}>
            <input type="checkbox" checked={rg.notifier_messages} onChange={(e) => setRg({ ...rg, notifier_messages: e.target.checked })} />
            <span style={{ fontSize: 14 }}>Me prévenir par courriel à chaque nouveau message d'un visiteur</span>
          </label>
          <button style={btn()} disabled={occupe} onClick={sauverReglages}>{occupe ? '⏳' : 'Enregistrer'}</button>
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, marginTop: 22, fontSize: 13, color: '#4b5563', lineHeight: 1.6 }}>
            <strong>Comment ça marche</strong><br />
            • Vous affichez vos annonces ; <strong>aucun paiement ni achat</strong> ne passe par le site.<br />
            • Un visiteur intéressé vous écrit avec le formulaire : <strong>votre courriel et votre téléphone restent cachés</strong>. Vous recevez le message par courriel et ici ; en répondant à ce courriel, votre réponse va directement au visiteur.<br />
            • Les annonces expirées ou marquées vendues quittent le site mais restent ici, prêtes à être remises en ligne.
          </div>
        </div>
      )}

      {form && (
        <div onClick={() => !occupe && setForm(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 620, maxHeight: '92vh', overflow: 'auto', padding: 22 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 18 }}>{edition ? "Modifier l'annonce" : 'Nouvelle annonce'}</h3>
            <Champ label="Titre *" valeur={form.titre} onChange={(v) => setForm({ ...form, titre: v })} />
            <div style={{ marginBottom: 12 }}><label style={lbl}>Description</label><textarea style={{ ...champ, minHeight: 100 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div style={{ marginBottom: 12 }}><label style={lbl}>Photos (une adresse https:// par ligne, max 12)</label><textarea style={{ ...champ, minHeight: 70 }} value={form.photos} onChange={(e) => setForm({ ...form, photos: e.target.value })} placeholder="https://…/photo1.jpg" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
              <Champ label="Prix ($)" type="number" valeur={form.prix} onChange={(v) => setForm({ ...form, prix: v })} aide="Laissez vide pour « à discuter »." />
              <Champ label="Texte à la place du prix" valeur={form.prixTexte} onChange={(v) => setForm({ ...form, prixTexte: v })} placeholder="À discuter, Gratuit…" aide="Affiché si le prix est vide." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
              <div style={{ marginBottom: 12 }}><label style={lbl}>Catégorie</label><input list="cats-annonces" style={champ} value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} placeholder="Maison, Véhicules…" /><datalist id="cats-annonces">{categoriesConnues.map((x) => <option key={x} value={x} />)}</datalist></div>
              <Champ label="Lieu" valeur={form.lieu} onChange={(v) => setForm({ ...form, lieu: v })} placeholder="Québec, Lévis…" />
            </div>
            <div style={{ marginBottom: 12 }}><label style={lbl}>Détails (un par ligne : Nom : valeur)</label><textarea style={{ ...champ, minHeight: 70 }} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder={'Marque : Trek\nAnnée : 2021'} /></div>
            {!edition && <Champ label="Durée d'affichage (jours)" type="number" valeur={form.dureeJours} onChange={(v) => setForm({ ...form, dureeJours: v })} aide="0 = sans expiration." />}
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, marginBottom: 16, cursor: 'pointer' }}><input type="checkbox" checked={form.vedette} onChange={(e) => setForm({ ...form, vedette: e.target.checked })} /> ⭐ Mettre en vedette (en haut de la liste)</label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={btn('#6b7280', false)} disabled={occupe} onClick={() => setForm(null)}>Fermer</button>
              <button style={btn()} disabled={occupe} onClick={enregistrer}>{occupe ? '⏳' : edition ? 'Enregistrer' : "Publier l'annonce"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}