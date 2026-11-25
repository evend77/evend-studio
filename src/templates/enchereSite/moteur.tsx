// src/templates/enchereSite/moteur.tsx
// e-Vend Studio — Moteur partagé des sites d'enchères (Galerie / Live).
// Données réelles via /api/encheres-studio, enchérisseur sans compte (code par courriel), mise maximale automatique.

import { useState, useEffect, useCallback, useRef } from 'react';

const API = '/api/encheres-studio';

// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface LotPub {
  id: number;
  titre: string;
  description: string;
  photos: string[];
  categorie: string;
  condition: string;
  tags: string[];
  vedette: boolean;
  prixBase: number;
  prixActuel: number | null;
  increment: number;
  nbMises: number;
  dateDebut: string;
  dateFin: string;
  statut: 'active' | 'a_venir' | 'terminee' | 'sans_gagnant' | string;
  aReserve: boolean;
  reserveAtteinte: boolean | null;
  meneurNom: string | null;
  estMeneur?: boolean;
  monMaximum?: number | null;
  historique?: { montant: number; nom: string; auto: boolean; date: string }[];
}

export interface MiseTicker { nom: string; montant: number; lotId: number; lot: string; date: string; }
export interface Session { token: string; prenom: string; email: string; }

export const fmt = (n: number | null | undefined) =>
  n == null ? '—' : new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 2 }).format(n);

export const pad = (n: number) => String(n).padStart(2, '0');

// ─── Session (localStorage, jamais bloquant) ──────────────────────────────────
function lireSession(gid: number): Session | null {
  try { const r = window.localStorage.getItem(`ens_session_${gid}`); return r ? JSON.parse(r) : null; } catch { return null; }
}
function ecrireSession(gid: number, s: Session | null) {
  try { if (s) window.localStorage.setItem(`ens_session_${gid}`, JSON.stringify(s)); else window.localStorage.removeItem(`ens_session_${gid}`); } catch { /* ignore */ }
}

// ─── Hook principal ───────────────────────────────────────────────────────────
export function useEncheres(gid: number, lotsDemo: LotPub[]) {
  const reel = gid > 0;
  const [lots, setLots] = useState<LotPub[]>(reel ? [] : lotsDemo);
  const [ticker, setTicker] = useState<MiseTicker[]>([]);
  const [loading, setLoading] = useState(reel);
  const [demo, setDemo] = useState(!reel);
  const [delta, setDelta] = useState(0);              // décalage horloge serveur - client (ms)
  const [session, setSessionState] = useState<Session | null>(() => (reel && typeof window !== 'undefined' ? lireSession(gid) : null));
  const [verification, setVerification] = useState(true);
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const setSession = useCallback((s: Session | null) => { setSessionState(s); if (gid > 0) ecrireSession(gid, s); }, [gid]);

  const charger = useCallback(async () => {
    if (!reel) return;
    try {
      const h: Record<string, string> = {};
      if (sessionRef.current?.token) h['x-ens-token'] = sessionRef.current.token;
      const [a, b] = await Promise.all([
        fetch(`${API}/${gid}/lots`, { headers: h }),
        fetch(`${API}/${gid}/ticker`),
      ]);
      if (a.ok) {
        const d = await a.json();
        setLots(d.lots || []);
        setVerification(d.verification_courriel !== false);
        if (d.serveur_maintenant) setDelta(new Date(d.serveur_maintenant).getTime() - Date.now());
        setDemo(false);
      } else if (lotsDemo.length) { setLots(lotsDemo); setDemo(true); }
      if (b.ok) { const t = await b.json(); setTicker(t.mises || []); }
    } catch {
      setLots((prev) => (prev.length ? prev : lotsDemo)); setDemo((p) => p || true);
    } finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gid, reel]);

  useEffect(() => {
    if (!reel) return;
    charger();
    const id = setInterval(() => { if (typeof document === 'undefined' || !document.hidden) charger(); }, 8000);
    return () => clearInterval(id);
  }, [charger, reel, session?.token]);

  return { lots, ticker, loading, demo, delta, session, setSession, verification, recharger: charger };
}

// ─── Minuterie ────────────────────────────────────────────────────────────────
export function useTimer(dateFin: string, delta = 0) {
  const calc = () => {
    const diff = new Date(dateFin).getTime() - (Date.now() + delta);
    if (diff <= 0) return { j: 0, h: 0, m: 0, s: 0, expire: true, ms: 0 };
    return { j: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000), expire: false, ms: diff };
  };
  const [t, setT] = useState(calc());
  useEffect(() => { setT(calc()); const id = setInterval(() => setT(calc()), 1000); return () => clearInterval(id); /* eslint-disable-next-line */ }, [dateFin, delta]);
  return t;
}

export function prixAffiche(l: LotPub) { return l.nbMises > 0 && l.prixActuel != null ? l.prixActuel : l.prixBase; }
export function miseMinimale(l: LotPub) { return l.nbMises > 0 && l.prixActuel != null ? Math.round((l.prixActuel + l.increment) * 100) / 100 : l.prixBase; }

// ─── Boîte de mise ────────────────────────────────────────────────────────────
export interface ThemeMise {
  cp: string;               // couleur principale
  ca?: string;              // 2e couleur du dégradé du bouton
  texteBouton: string;      // couleur du texte du bouton
  police: string;
  rapides?: boolean;        // boutons de mise rapide
}

const champ: React.CSSProperties = { width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };

export function BoiteMise({ lot, gid, theme, demo, delta, session, setSession, verification, onChange }: {
  lot: LotPub; gid: number; theme: ThemeMise; demo: boolean; delta: number;
  session: Session | null; setSession: (s: Session | null) => void; verification: boolean; onChange: () => void;
}) {
  const { cp } = theme;
  const t = useTimer(lot.dateFin, delta);
  const min = miseMinimale(lot);
  const [montant, setMontant] = useState<string>(String(min));
  const [prenom, setPrenom] = useState(session?.prenom || '');
  const [email, setEmail] = useState(session?.email || '');
  const [code, setCode] = useState('');
  const [etape, setEtape] = useState<'identite' | 'code'>('identite');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const [info, setInfo] = useState('');
  const [resultat, setResultat] = useState<{ ok: boolean; texte: string } | null>(null);
  const dernierMin = useRef(min);
  const [mon, setMon] = useState<number | null>(null);   // mon maximum (renvoyé par le détail du lot)

  useEffect(() => {
    if (gid <= 0 || !session) { setMon(null); return; }
    let vivant = true;
    fetch(`${API}/${gid}/lots/${lot.id}`, { headers: { 'x-ens-token': session.token } })
      .then((r) => (r.ok ? r.json() : null)).then((d) => { if (vivant && d) setMon(d.monMaximum != null ? Number(d.monMaximum) : null); }).catch(() => { /* ignore */ });
    return () => { vivant = false; };
  }, [gid, lot.id, lot.nbMises, session?.token]);

  // Si un autre enchérisseur fait monter le prix, remonter le montant suggéré
  useEffect(() => {
    const cur = parseFloat(montant) || 0;
    if (min !== dernierMin.current) { if (cur < min) setMontant(String(min)); dernierMin.current = min; }
    // eslint-disable-next-line
  }, [min]);
  useEffect(() => { setMontant(String(miseMinimale(lot))); setResultat(null); setErreur(''); setInfo(''); /* eslint-disable-next-line */ }, [lot.id]);

  const bouton: React.CSSProperties = {
    padding: '11px 18px', background: theme.ca ? `linear-gradient(135deg, ${cp}, ${theme.ca})` : cp, border: 'none', borderRadius: 8,
    color: theme.texteBouton, fontWeight: 800, fontSize: 14, cursor: envoi ? 'wait' : 'pointer', whiteSpace: 'nowrap', fontFamily: theme.police, opacity: envoi ? 0.7 : 1,
  };

  if (lot.statut === 'terminee') {
    return <div style={{ textAlign: 'center', padding: '18px 8px', color: 'rgba(255,255,255,0.6)', fontSize: 14 }}><div style={{ fontSize: 32, marginBottom: 6 }}>🏆</div>Enchère terminée — vendu {fmt(prixAffiche(lot))}{lot.estMeneur ? <div style={{ color: '#4ade80', fontWeight: 700, marginTop: 8 }}>Félicitations, vous avez remporté ce lot ! Le vendeur vous contactera par courriel.</div> : null}</div>;
  }
  if (lot.statut === 'sans_gagnant') return <div style={{ textAlign: 'center', padding: '18px 8px', color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Enchère terminée — lot non vendu.</div>;
  if (lot.statut === 'a_venir') return <div style={{ textAlign: 'center', padding: '18px 8px', color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>⏳ Cette enchère commence le {new Date(lot.dateDebut).toLocaleString('fr-CA', { dateStyle: 'long', timeStyle: 'short' })}.</div>;
  if (t.expire) return <div style={{ textAlign: 'center', padding: '18px 8px', color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>⌛ Enchère terminée — résultat en cours de confirmation…</div>;

  const post = async (url: string, body: unknown, token?: string) => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) h['x-ens-token'] = token;
    const r = await fetch(url, { method: 'POST', headers: h, body: JSON.stringify(body) });
    let d: any = {}; try { d = await r.json(); } catch { /* ignore */ }
    return { ok: r.ok, d };
  };

  const demanderCode = async () => {
    setErreur(''); setInfo('');
    if (prenom.trim().length < 2) { setErreur('Entrez votre prénom.'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setErreur('Courriel invalide.'); return; }
    setEnvoi(true);
    try {
      const { ok, d } = await post(`${API}/${gid}/code`, { email: email.trim(), prenom: prenom.trim() });
      if (!ok) { setErreur(d.message || 'Erreur.'); return; }
      if (d.verification === false && d.token) { setSession({ token: d.token, prenom: d.prenom, email: email.trim().toLowerCase() }); return; }
      setEtape('code'); setInfo(`Un code à 6 chiffres a été envoyé à ${email.trim()}.`);
    } catch { setErreur('Erreur réseau.'); } finally { setEnvoi(false); }
  };

  const validerCode = async () => {
    setErreur('');
    if (code.replace(/\D/g, '').length !== 6) { setErreur('Entrez le code à 6 chiffres.'); return; }
    setEnvoi(true);
    try {
      const { ok, d } = await post(`${API}/${gid}/verifier`, { email: email.trim(), code });
      if (!ok) { setErreur(d.message || 'Code incorrect.'); return; }
      setSession({ token: d.token, prenom: d.prenom, email: email.trim().toLowerCase() });
      setInfo(''); setCode('');
    } catch { setErreur('Erreur réseau.'); } finally { setEnvoi(false); }
  };

  const miser = async () => {
    setErreur(''); setResultat(null);
    const m = parseFloat(montant);
    if (!(m > 0)) { setErreur('Entrez un montant.'); return; }
    if (m < min && !(lot.estMeneur && (mon || 0) < m)) { setErreur(`Mise minimale : ${fmt(min)}.`); return; }
    if (!session) return;
    setEnvoi(true);
    try {
      const { ok, d } = await post(`${API}/${gid}/lots/${lot.id}/miser`, { montant: m }, session.token);
      if (!ok) {
        if (d.code === 'non_verifie') { setSession(null); setEtape('identite'); setErreur('Votre session a expiré. Vérifiez à nouveau votre courriel.'); return; }
        setErreur(d.message || 'Erreur.'); onChange(); return;
      }
      setResultat({ ok: d.resultat === 'meneur', texte: `${d.message} Prix actuel : ${fmt(d.prixActuel)}.${d.prolonge ? ' ⏱ L\'enchère a été prolongée de quelques minutes.' : ''}` });
      onChange();
    } catch { setErreur('Erreur réseau.'); } finally { setEnvoi(false); }
  };

  const pasInc = lot.increment || 1;
  const rapides = theme.rapides ? [0, 1, 2, 5].map((k) => Math.round((min + pasInc * k) * 100) / 100) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontFamily: theme.police }}>
      {demo && <div style={{ background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.3)', borderRadius: 8, padding: '8px 10px', color: '#fde047', fontSize: 12 }}>Aperçu avec des lots d'exemple : les mises sont désactivées. Ajoutez vos lots dans « Mes enchères ».</div>}
      {lot.estMeneur && <div style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 8, padding: '9px 10px', color: '#4ade80', fontSize: 13, fontWeight: 700 }}>✅ Vous êtes en tête{mon ? ` (votre maximum : ${fmt(mon)})` : ''}</div>}
      {!lot.estMeneur && mon != null && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '9px 10px', color: '#f87171', fontSize: 13, fontWeight: 600 }}>Vous avez été surenchéri. Misez à nouveau pour reprendre la tête.</div>}
      {resultat && <div style={{ background: resultat.ok ? 'rgba(74,222,128,0.12)' : 'rgba(250,204,21,0.1)', border: `1px solid ${resultat.ok ? 'rgba(74,222,128,0.3)' : 'rgba(250,204,21,0.3)'}`, borderRadius: 8, padding: '10px', color: resultat.ok ? '#4ade80' : '#fde047', fontSize: 13 }}>{resultat.texte}</div>}
      {info && <div style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 8, padding: '9px 10px', color: '#93c5fd', fontSize: 13 }}>{info}</div>}
      {erreur && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '9px 10px', color: '#f87171', fontSize: 13 }}>{erreur}</div>}

      {!session && !demo && (
        etape === 'identite' ? (
          <>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>Pas de compte à créer. {verification ? 'Nous vous envoyons un code par courriel pour confirmer votre identité.' : 'Indiquez votre prénom et courriel pour miser.'}</p>
            <input style={champ} placeholder="Votre prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)} maxLength={40} />
            <input style={champ} type="email" placeholder="Votre courriel" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && demanderCode()} />
            <button onClick={demanderCode} disabled={envoi} style={bouton}>{envoi ? '⏳' : verification ? 'Recevoir mon code' : 'Continuer'}</button>
          </>
        ) : (
          <>
            <input style={{ ...champ, letterSpacing: 8, textAlign: 'center', fontSize: 20, fontWeight: 700 }} inputMode="numeric" maxLength={6} placeholder="000000" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} onKeyDown={(e) => e.key === 'Enter' && validerCode()} />
            <button onClick={validerCode} disabled={envoi} style={bouton}>{envoi ? '⏳' : 'Confirmer'}</button>
            <button onClick={() => { setEtape('identite'); setCode(''); setInfo(''); setErreur(''); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>Changer de courriel / renvoyer le code</button>
          </>
        )
      )}

      {(session || demo) && (
        <>
          {session && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Vous misez en tant que <strong style={{ color: '#fff' }}>{session.prenom}</strong> · <button onClick={() => { setSession(null); setEtape('identite'); }} style={{ background: 'none', border: 'none', color: cp, cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>changer</button></p>}
          {rapides.length > 0 && (
            <div style={{ display: 'flex', gap: 6 }}>
              {rapides.map((v) => (
                <button key={v} onClick={() => setMontant(String(v))} style={{ flex: 1, padding: '8px 4px', borderRadius: 8, border: `1px solid ${parseFloat(montant) === v ? cp : 'rgba(255,255,255,0.12)'}`, background: parseFloat(montant) === v ? cp + '25' : 'rgba(255,255,255,0.04)', color: parseFloat(montant) === v ? cp : 'rgba(255,255,255,0.55)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>{Math.round(v)}$</button>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="number" style={{ ...champ, flex: 1 }} min={min} step={pasInc} value={montant} onChange={(e) => setMontant(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !demo && miser()} />
            <button onClick={miser} disabled={envoi || demo} style={{ ...bouton, opacity: demo ? 0.5 : bouton.opacity }}>{envoi ? '⏳' : '🔨 Miser'}</button>
          </div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>Minimum : {fmt(min)} · Incrément : {fmt(pasInc)}.<br />Entrez <strong>le maximum que vous acceptez de payer</strong> : le système mise pour vous, un incrément à la fois, seulement au besoin.</p>
        </>
      )}
    </div>
  );
}

// ─── Petits blocs réutilisables ───────────────────────────────────────────────
export function PastilleReserve({ lot }: { lot: LotPub }) {
  if (!lot.aReserve) return null;
  return <span style={{ fontSize: 12, color: lot.reserveAtteinte ? '#4ade80' : 'rgba(255,255,255,0.45)' }}>{lot.reserveAtteinte ? '✅ Réserve atteinte' : '🔒 Réserve non atteinte'}</span>;
}

export function HistoriqueMises({ lotId, gid, cp, actif }: { lotId: number; gid: number; cp: string; actif: number }) {
  const [h, setH] = useState<NonNullable<LotPub['historique']>>([]);
  useEffect(() => {
    if (gid <= 0) return;
    let vivant = true;
    fetch(`${API}/${gid}/lots/${lotId}`).then((r) => (r.ok ? r.json() : null)).then((d) => { if (vivant && d) setH(d.historique || []); }).catch(() => { /* ignore */ });
    return () => { vivant = false; };
  }, [lotId, gid, actif]);
  if (!h.length) return null;
  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12, marginTop: 8 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Historique des mises</p>
      {h.slice(0, 8).map((x, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 }}>
          <span style={{ color: i === 0 ? cp : 'rgba(255,255,255,0.45)' }}>{x.nom}{x.auto ? ' · auto' : ''}</span>
          <span style={{ color: i === 0 ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight: i === 0 ? 800 : 400 }}>{fmt(x.montant)}</span>
        </div>
      ))}
    </div>
  );
}