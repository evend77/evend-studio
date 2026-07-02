/**
 * StudioMonCompte.tsx — e-Vend Studio
 * Chemin : src/pages/gestionnaire/StudioMonCompte.tsx
 *
 * Gestion du compte vendeur : infos, adresse, logo, bannière,
 * description, politiques, entreprise, mot de passe.
 *
 * Routes API :
 *   GET    /api/studio/mon-compte/:gestionnaireId           → charger
 *   PUT    /api/studio/mon-compte/:gestionnaireId           → sauvegarder
 *   PUT    /api/studio/mon-compte/:gestionnaireId/mot-de-passe
 *   POST   /api/studio/mon-compte/:gestionnaireId/logo
 *   POST   /api/studio/mon-compte/:gestionnaireId/banniere
 *   DELETE /api/studio/mon-compte/:gestionnaireId/logo
 *   DELETE /api/studio/mon-compte/:gestionnaireId/banniere
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = (window as any).API_BASE || '/api';
const HERE_API_KEY = 'K3Hf5kk3yyKiMLty8ptK9YKiKla9t_mUj_JVObLwXtk';

// ─── Palette Studio ───────────────────────────────────────────────────────────
const C = {
  bg:          '#f4f6f8',
  card:        '#ffffff',
  border:      '#e2e8f0',
  gold:        '#c9a96e',
  goldLight:   'rgba(201,169,110,0.12)',
  green:       '#10b981',
  greenLight:  'rgba(16,185,129,0.10)',
  red:         '#ef4444',
  redLight:    'rgba(239,68,68,0.10)',
  orange:      '#f59e0b',
  text:        '#1e293b',
  textLight:   '#64748b',
  textXLight:  '#94a3b8',
  border2:     '#cbd5e1',
};

const inp: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box' as const,
  padding: '9px 12px', border: `1px solid ${C.border2}`,
  borderRadius: '8px', fontSize: '13px', color: C.text,
  background: '#f8fafc', outline: 'none',
};

// ─── Provinces canadiennes ────────────────────────────────────────────────────
const PROVINCES = [
  { value: 'qc', label: 'Québec' }, { value: 'on', label: 'Ontario' },
  { value: 'bc', label: 'Colombie-Britannique' }, { value: 'ab', label: 'Alberta' },
  { value: 'sk', label: 'Saskatchewan' }, { value: 'mb', label: 'Manitoba' },
  { value: 'nb', label: 'Nouveau-Brunswick' }, { value: 'ns', label: 'Nouvelle-Écosse' },
  { value: 'pe', label: 'Île-du-Prince-Édouard' }, { value: 'nl', label: 'Terre-Neuve-et-Labrador' },
  { value: 'yt', label: 'Yukon' }, { value: 'nt', label: 'Territoires du Nord-Ouest' },
  { value: 'nu', label: 'Nunavut' },
];

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'ok' | 'err' }) {
  return (
    <div style={{ position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)', background: type === 'ok' ? C.green : C.red, color: '#fff', padding: '11px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, zIndex: 9999, boxShadow: '0 6px 24px rgba(0,0,0,0.18)', animation: 'fadeInUp 0.25s ease', whiteSpace: 'nowrap' }}>
      {type === 'ok' ? '✅ ' : '❌ '}{msg}
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
function Section({ titre, icon, children }: { titre: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', overflow: 'hidden', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ padding: '14px 20px', borderBottom: `2px solid ${C.gold}`, background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '18px' }}>{icon}</span>
        <h3 style={{ fontSize: '13px', fontWeight: 800, color: C.gold, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{titre}</h3>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  );
}

// ─── Champ label + input ──────────────────────────────────────────────────────
function Champ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>{label}</label>
      {hint && <p style={{ margin: '0 0 5px', fontSize: '11px', color: C.textXLight }}>{hint}</p>}
      {children}
    </div>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ value, onChange, label, hint }: { value: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', cursor: 'pointer' }} onClick={() => onChange(!value)}>
      <div style={{ width: '44px', height: '24px', borderRadius: '12px', background: value ? C.gold : '#d1d5db', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: '2px', left: value ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: C.text }}>{label}</p>
        {hint && <p style={{ margin: 0, fontSize: '11px', color: C.textXLight }}>{hint}</p>}
      </div>
    </div>
  );
}

// ─── Autocomplete adresse HERE ────────────────────────────────────────────────
function AdresseAutocomplete({ onSelect }: { onSelect: (data: any) => void }) {
  const [query, setQuery]           = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading]       = useState(false);
  const [open, setOpen]             = useState(false);
  const wrapperRef                  = useRef<HTMLDivElement>(null);
  const timerRef                    = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (query.length < 3) { setSuggestions([]); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://autocomplete.search.hereapi.com/v1/autocomplete?q=${encodeURIComponent(query)}&apiKey=${HERE_API_KEY}&limit=5&in=countryCode:CAN`);
        const data = await res.json();
        setSuggestions(data.items || []);
        setOpen(true);
      } catch { setSuggestions([]); }
      finally { setLoading(false); }
    }, 300);
  }, [query]);

  async function handleSelect(suggestion: any) {
    setQuery(suggestion.title);
    setOpen(false);
    try {
      const res  = await fetch(`https://lookup.search.hereapi.com/v1/lookup?id=${suggestion.id}&apiKey=${HERE_API_KEY}`);
      const data = await res.json();
      const addr = data.address || {};
      let numero = '', rue = '';
      if (addr.houseNumber) { numero = addr.houseNumber; rue = addr.street || ''; }
      else if (addr.street) {
        const m = addr.street.match(/^(\d+[a-z]?)[\s-]+(.+)$/i);
        if (m) { numero = m[1]; rue = m[2]; } else { rue = addr.street; }
      }
      onSelect({ numero, rue, ville: addr.city || '', province: addr.stateCode?.toLowerCase() || '', codePostal: addr.postalCode || '', pays: 'canada', latitude: data.position?.lat, longitude: data.position?.lng });
    } catch {}
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <input value={query} onChange={e => setQuery(e.target.value)} onFocus={() => query.length >= 3 && setOpen(true)} placeholder="Rechercher une adresse au Canada…" style={inp} />
      {loading && <span style={{ position: 'absolute', right: '10px', top: '10px', fontSize: '12px', color: C.textXLight }}>⏳</span>}
      {open && suggestions.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: `1px solid ${C.border}`, borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 1000, maxHeight: '240px', overflowY: 'auto' }}>
          {suggestions.map((s, i) => (
            <div key={i} onClick={() => handleSelect(s)} style={{ padding: '10px 14px', fontSize: '13px', cursor: 'pointer', borderBottom: i < suggestions.length - 1 ? `1px solid ${C.border}` : 'none' }}
              onMouseEnter={e => (e.currentTarget.style.background = C.goldLight)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              {s.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Upload image ─────────────────────────────────────────────────────────────
function ImageUploader({ label, hint, imageUrl, onUpload, onDelete, uploading, aspectRatio = '16/5' }: {
  label: string; hint?: string; imageUrl: string; onUpload: (f: File) => void;
  onDelete: () => void; uploading?: boolean; aspectRatio?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <Champ label={label} hint={hint}>
      {imageUrl ? (
        <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${C.border}`, marginBottom: '8px' }}>
          <img src={imageUrl} alt={label} style={{ width: '100%', aspectRatio, objectFit: 'cover', display: 'block' }} />
          {uploading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: C.textLight }}>⏳ Upload…</div>}
        </div>
      ) : (
        <div onClick={() => ref.current?.click()} style={{ border: `2px dashed ${C.border}`, borderRadius: '10px', padding: '28px', textAlign: 'center', cursor: 'pointer', background: '#f8fafc', marginBottom: '8px' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.background = C.goldLight; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = '#f8fafc'; }}>
          <p style={{ margin: 0, fontSize: '24px' }}>🖼️</p>
          <p style={{ margin: '6px 0 0', fontSize: '12px', color: C.textLight }}>Cliquer pour importer</p>
          <p style={{ margin: '2px 0 0', fontSize: '11px', color: C.textXLight }}>JPG, PNG, WebP — max 5 Mo</p>
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) onUpload(e.target.files[0]); e.target.value = ''; }} />
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => ref.current?.click()} disabled={uploading} style={{ padding: '7px 14px', background: C.goldLight, border: `1px solid ${C.gold}`, borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: C.gold, cursor: 'pointer' }}>
          {imageUrl ? 'Changer' : 'Télécharger'}
        </button>
        {imageUrl && <button onClick={onDelete} style={{ padding: '7px 14px', background: '#fff', border: `1px solid ${C.red}`, borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: C.red, cursor: 'pointer' }}>Supprimer</button>}
      </div>
    </Champ>
  );
}

// ─── Modal changement mot de passe ───────────────────────────────────────────
function ModalMotDePasse({ gestionnaireId, token, onClose, onSuccess }: { gestionnaireId: number; token: string | null; onClose: () => void; onSuccess: () => void }) {
  const [actuel, setActuel]     = useState('');
  const [nouveau, setNouveau]   = useState('');
  const [confirmer, setConfirmer] = useState('');
  const [saving, setSaving]     = useState(false);
  const [erreur, setErreur]     = useState('');

  async function sauvegarder() {
    setErreur('');
    if (nouveau.length < 8) { setErreur('Le nouveau mot de passe doit contenir au moins 8 caractères.'); return; }
    if (nouveau !== confirmer) { setErreur('Les mots de passe ne correspondent pas.'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/studio/mon-compte/${gestionnaireId}/mot-de-passe`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mot_de_passe_actuel: actuel, nouveau_mot_de_passe: nouveau }),
      });
      const data = await res.json();
      if (!res.ok) { setErreur(data.error || 'Erreur.'); return; }
      onSuccess();
      onClose();
    } catch { setErreur('Erreur de connexion.'); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 800, color: C.text }}>🔐 Changer le mot de passe</h2>
        {erreur && <div style={{ background: C.redLight, border: `1px solid ${C.red}`, borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: C.red }}>❌ {erreur}</div>}
        {[
          { label: 'Mot de passe actuel', value: actuel, set: setActuel },
          { label: 'Nouveau mot de passe', value: nouveau, set: setNouveau },
          { label: 'Confirmer le nouveau mot de passe', value: confirmer, set: setConfirmer },
        ].map(f => (
          <div key={f.label} style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.textLight, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{f.label}</label>
            <input type="password" value={f.value} onChange={e => f.set(e.target.value)} style={inp} />
          </div>
        ))}
        <p style={{ fontSize: '11px', color: C.textXLight, margin: '0 0 20px' }}>Minimum 8 caractères.</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 20px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: C.textLight }}>Annuler</button>
          <button onClick={sauvegarder} disabled={saving} style={{ padding: '9px 22px', background: 'linear-gradient(135deg, #c9a96e, #a07840)', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
            {saving ? '⏳ Sauvegarde…' : '💾 Modifier'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
interface Props { gestionnaireId: number; }

export default function StudioMonCompte({ gestionnaireId }: Props) {
  const token = localStorage.getItem('token');

  // ── État du formulaire ────────────────────────────────────────────────────
  const [nom, setNom]                       = useState('');
  const [nomBoutique, setNomBoutique]       = useState('');
  const [email, setEmail]                   = useState('');
  const [telephone, setTelephone]           = useState('');
  const [numCivique, setNumCivique]         = useState('');
  const [rue, setRue]                       = useState('');
  const [ville, setVille]                   = useState('');
  const [province, setProvince]             = useState('qc');
  const [codePostal, setCodePostal]         = useState('');
  const [pays, setPays]                     = useState('canada');
  const [logoUrl, setLogoUrl]               = useState('');
  const [banniereUrl, setBanniereUrl]       = useState('');
  const [description, setDescription]       = useState('');
  const [politiqueRetours, setPolitiqueRetours]     = useState('');
  const [politiqueLivraison, setPolitiqueLivraison] = useState('');
  const [typeEntreprise, setTypeEntreprise] = useState('');
  const [estEntreprise, setEstEntreprise]   = useState(false);
  const [provinceEntreprise, setProvinceEntreprise] = useState('qc');
  const [numEntreprise, setNumEntreprise]   = useState('');
  const [noTps, setNoTps]                   = useState('');
  const [noTaxeProvinciale, setNoTaxeProvinciale] = useState('');
  const [joursRemboursement, setJoursRemboursement] = useState('14');
  const [latitude, setLatitude]             = useState<number | null>(null);
  const [longitude, setLongitude]           = useState<number | null>(null);

  // ── UI ────────────────────────────────────────────────────────────────────
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [uploadingLogo, setUploadingLogo]       = useState(false);
  const [uploadingBanniere, setUploadingBanniere] = useState(false);
  const [toast, setToast]               = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [showModalMdp, setShowModalMdp] = useState(false);
  const [onglet, setOnglet]             = useState<'profil' | 'boutique' | 'entreprise' | 'securite'>('profil');

  // ── Charger ───────────────────────────────────────────────────────────────
  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/studio/mon-compte/${gestionnaireId}`, {
        credentials: 'include', headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const v    = data.vendeur;
      setNom(v.nom || ''); setNomBoutique(v.nom_boutique || ''); setEmail(v.email || '');
      setTelephone(v.telephone || ''); setNumCivique(v.num_civique || ''); setRue(v.rue || '');
      setVille(v.ville || ''); setProvince(v.province || 'qc'); setCodePostal(v.code_postal || '');
      setPays(v.pays || 'canada'); setLogoUrl(v.logo_url || ''); setBanniereUrl(v.banniere_url || '');
      setDescription(v.description || ''); setPolitiqueRetours(v.politique_retours || '');
      setPolitiqueLivraison(v.politique_livraison || ''); setTypeEntreprise(v.type_entreprise || '');
      setEstEntreprise(v.est_entreprise || false); setProvinceEntreprise(v.province_entreprise || 'qc');
      setNumEntreprise(v.num_entreprise || ''); setNoTps(v.no_tps || '');
      setNoTaxeProvinciale(v.no_taxe_provinciale || '');
      setJoursRemboursement(String(v.jours_remboursement || 14));
      setLatitude(v.latitude ?? null); setLongitude(v.longitude ?? null);
    } catch { showToast('Erreur lors du chargement.', 'err'); }
    finally { setLoading(false); }
  }, [gestionnaireId, token]);

  useEffect(() => { charger(); }, [charger]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t); }, [toast]);

  function showToast(msg: string, type: 'ok' | 'err') { setToast({ msg, type }); }

  // ── Sauvegarder ──────────────────────────────────────────────────────────
  async function sauvegarder() {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/studio/mon-compte/${gestionnaireId}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nom, nom_boutique: nomBoutique, telephone,
          num_civique: numCivique, rue, ville, province, code_postal: codePostal, pays,
          description, politique_retours: politiqueRetours, politique_livraison: politiqueLivraison,
          type_entreprise: typeEntreprise, est_entreprise: estEntreprise,
          province_entreprise: provinceEntreprise, num_entreprise: numEntreprise,
          no_tps: noTps, no_taxe_provinciale: noTaxeProvinciale,
          jours_remboursement: parseInt(joursRemboursement, 10),
          latitude, longitude,
        }),
      });
      if (!res.ok) throw new Error();
      showToast('Compte sauvegardé !', 'ok');
    } catch { showToast('Erreur lors de la sauvegarde.', 'err'); }
    finally { setSaving(false); }
  }

  // ── Upload logo ───────────────────────────────────────────────────────────
  async function uploadLogo(file: File) {
    setUploadingLogo(true);
    try {
      const form = new FormData(); form.append('logo', file);
      const res  = await fetch(`${API_BASE}/studio/mon-compte/${gestionnaireId}/logo`, {
        method: 'POST', credentials: 'include', headers: { Authorization: `Bearer ${token}` }, body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLogoUrl(data.logo_url);
      showToast('Logo mis à jour !', 'ok');
    } catch (e: any) { showToast(e.message || 'Erreur upload logo.', 'err'); }
    finally { setUploadingLogo(false); }
  }

  async function supprimerLogo() {
    try {
      await fetch(`${API_BASE}/studio/mon-compte/${gestionnaireId}/logo`, { method: 'DELETE', credentials: 'include', headers: { Authorization: `Bearer ${token}` } });
      setLogoUrl(''); showToast('Logo supprimé.', 'ok');
    } catch { showToast('Erreur.', 'err'); }
  }

  // ── Upload bannière ───────────────────────────────────────────────────────
  async function uploadBanniere(file: File) {
    setUploadingBanniere(true);
    try {
      const form = new FormData(); form.append('banniere', file);
      const res  = await fetch(`${API_BASE}/studio/mon-compte/${gestionnaireId}/banniere`, {
        method: 'POST', credentials: 'include', headers: { Authorization: `Bearer ${token}` }, body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBanniereUrl(data.banniere_url);
      showToast('Bannière mise à jour !', 'ok');
    } catch (e: any) { showToast(e.message || 'Erreur upload bannière.', 'err'); }
    finally { setUploadingBanniere(false); }
  }

  async function supprimerBanniere() {
    try {
      await fetch(`${API_BASE}/studio/mon-compte/${gestionnaireId}/banniere`, { method: 'DELETE', credentials: 'include', headers: { Authorization: `Bearer ${token}` } });
      setBanniereUrl(''); showToast('Bannière supprimée.', 'ok');
    } catch { showToast('Erreur.', 'err'); }
  }

  // ── Label numéro d'entreprise provincial ─────────────────────────────────
  const labelNumEntreprise = () => {
    const map: Record<string, string> = { qc: 'Numéro d\'entreprise du Québec (NEQ)', on: 'Numéro d\'enregistrement de l\'Ontario', bc: 'BC Business Number', ab: 'Alberta Corporate Access Number' };
    return map[provinceEntreprise] || 'Numéro d\'entreprise provincial';
  };

  const aTaxeDistincte = () => ['qc', 'bc', 'sk', 'mb'].includes(provinceEntreprise);

  const labelTaxeProvinciale = () => {
    const map: Record<string, string> = { qc: 'Numéro de TVQ', bc: 'Numéro de TVP (PST)', sk: 'Numéro de TVP (PST)', mb: 'Numéro de TVD (RST)' };
    return map[provinceEntreprise] || 'Numéro de taxe provinciale';
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: C.textLight, fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>👤</div>
        <p style={{ margin: 0 }}>Chargement de votre compte…</p>
      </div>
    </div>
  );

  const ONGLETS = [
    { id: 'profil',    label: '👤 Informations' },
    { id: 'boutique',  label: '🏪 Ma boutique' },
    { id: 'entreprise',label: '🏢 Entreprise' },
    { id: 'securite',  label: '🔐 Sécurité' },
  ] as const;

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '28px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateX(-50%) translateY(10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {showModalMdp && <ModalMotDePasse gestionnaireId={gestionnaireId} token={token} onClose={() => setShowModalMdp(false)} onSuccess={() => showToast('Mot de passe modifié !', 'ok')} />}

      {/* ── En-tête ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #c9a96e, #a07840)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 4px 12px rgba(201,169,110,0.3)' }}>👤</div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: C.text }}>Mon compte</h1>
            <p style={{ margin: 0, fontSize: '13px', color: C.textLight }}>{email}</p>
          </div>
        </div>
        {onglet !== 'securite' && (
          <button onClick={sauvegarder} disabled={saving} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #c9a96e, #a07840)', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(201,169,110,0.3)' }}>
            {saving ? '⏳ Sauvegarde…' : '💾 Sauvegarder'}
          </button>
        )}
      </div>

      {/* ── Onglets ── */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: `2px solid ${C.border}`, marginBottom: '24px', flexWrap: 'wrap' }}>
        {ONGLETS.map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)} style={{ padding: '10px 18px', border: 'none', cursor: 'pointer', borderRadius: '8px 8px 0 0', fontSize: '13px', fontWeight: onglet === o.id ? 700 : 500, background: onglet === o.id ? C.card : 'transparent', color: onglet === o.id ? C.gold : C.textLight, borderBottom: onglet === o.id ? `2px solid ${C.gold}` : '2px solid transparent', marginBottom: '-2px', transition: 'all 0.15s' }}>
            {o.label}
          </button>
        ))}
      </div>

      {/* ══ Informations personnelles ══ */}
      {onglet === 'profil' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
          <div>
            <Section titre="Informations personnelles" icon="👤">
              <Champ label="Nom complet">
                <input style={inp} value={nom} onChange={e => setNom(e.target.value)} placeholder="Jean Tremblay" />
              </Champ>
              <Champ label="Adresse courriel" hint="Non modifiable — contactez le support pour changer.">
                <input style={{ ...inp, background: '#f1f5f9', color: C.textLight }} value={email} readOnly />
              </Champ>
              <Champ label="Téléphone">
                <input style={inp} value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="514 555-1234" />
              </Champ>
            </Section>

            <Section titre="Adresse" icon="📍">
              <Champ label="Recherche automatique" hint="Tapez votre adresse pour remplir automatiquement les champs.">
                <AdresseAutocomplete onSelect={d => {
                  setNumCivique(d.numero || ''); setRue(d.rue || ''); setVille(d.ville || '');
                  if (d.province) setProvince(d.province);
                  setCodePostal(d.codePostal || '');
                  if (d.latitude) setLatitude(d.latitude);
                  if (d.longitude) setLongitude(d.longitude);
                }} />
              </Champ>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '10px' }}>
                <Champ label="N°">
                  <input style={inp} value={numCivique} onChange={e => setNumCivique(e.target.value)} placeholder="123" />
                </Champ>
                <Champ label="Rue">
                  <input style={inp} value={rue} onChange={e => setRue(e.target.value)} placeholder="Rue de la Paix" />
                </Champ>
              </div>
              <Champ label="Ville">
                <input style={inp} value={ville} onChange={e => setVille(e.target.value)} placeholder="Montréal" />
              </Champ>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <Champ label="Province">
                  <select style={inp} value={province} onChange={e => setProvince(e.target.value)}>
                    {PROVINCES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </Champ>
                <Champ label="Code postal">
                  <input style={inp} value={codePostal} onChange={e => setCodePostal(e.target.value.toUpperCase())} placeholder="H1A 1A1" maxLength={7} />
                </Champ>
              </div>
              <Champ label="Pays">
                <select style={inp} value={pays} onChange={e => setPays(e.target.value)}>
                  <option value="canada">🇨🇦 Canada</option>
                  <option value="usa">🇺🇸 États-Unis</option>
                </select>
              </Champ>
            </Section>
          </div>

          <div>
            <Section titre="Délai de remboursement" icon="↩️">
              <Champ label="Jours alloués pour les retours" hint="Nombre de jours après livraison pendant lesquels un client peut retourner un article.">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="number" style={{ ...inp, width: '100px', textAlign: 'center' }} value={joursRemboursement} onChange={e => setJoursRemboursement(e.target.value)} min="0" max="365" />
                  <span style={{ fontSize: '13px', color: C.textLight }}>jours</span>
                </div>
              </Champ>
            </Section>
          </div>
        </div>
      )}

      {/* ══ Ma boutique ══ */}
      {onglet === 'boutique' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
          <div>
            <Section titre="Identité de la boutique" icon="🏪">
              <Champ label="Nom de la boutique">
                <input style={inp} value={nomBoutique} onChange={e => setNomBoutique(e.target.value)} placeholder="Ma Super Boutique" />
              </Champ>
              <Champ label="Type d'entreprise">
                <input style={inp} value={typeEntreprise} onChange={e => setTypeEntreprise(e.target.value)} placeholder="Boutique de vêtements, Artisan, Épicerie fine…" />
              </Champ>
            </Section>

            <Section titre="Description de la boutique" icon="📝">
              <Champ label="À propos" hint="Décrivez votre boutique, vos valeurs, votre histoire. Ce texte apparaîtra sur votre site.">
                <textarea style={{ ...inp, minHeight: '120px', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Bienvenue dans notre boutique ! Nous proposons…" />
              </Champ>
            </Section>

            <Section titre="Politiques" icon="📋">
              <Champ label="Politique de retours" hint="Conditions de retour et remboursement pour vos clients.">
                <textarea style={{ ...inp, minHeight: '100px', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }} value={politiqueRetours} onChange={e => setPolitiqueRetours(e.target.value)} placeholder="Nous acceptons les retours dans les 30 jours suivant la livraison…" />
              </Champ>
              <Champ label="Politique de livraison" hint="Délais, frais et zones de livraison.">
                <textarea style={{ ...inp, minHeight: '100px', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }} value={politiqueLivraison} onChange={e => setPolitiqueLivraison(e.target.value)} placeholder="Nous expédions au Canada et aux États-Unis. Délai : 2 à 5 jours ouvrables…" />
              </Champ>
            </Section>
          </div>

          <div>
            <Section titre="Images de la boutique" icon="🖼️">
              <ImageUploader
                label="Bannière"
                hint="Affichée en haut de votre boutique. Recommandé : 1200 × 300 px."
                imageUrl={banniereUrl}
                onUpload={uploadBanniere}
                onDelete={supprimerBanniere}
                uploading={uploadingBanniere}
                aspectRatio="4/1"
              />
              <ImageUploader
                label="Logo"
                hint="Votre logo ou photo de profil. Recommandé : carré 400 × 400 px."
                imageUrl={logoUrl}
                onUpload={uploadLogo}
                onDelete={supprimerLogo}
                uploading={uploadingLogo}
                aspectRatio="1/1"
              />
            </Section>
          </div>
        </div>
      )}

      {/* ══ Entreprise ══ */}
      {onglet === 'entreprise' && (
        <div style={{ maxWidth: '680px' }}>
          <Section titre="Informations d'entreprise" icon="🏢">
            <Toggle
              value={estEntreprise}
              onChange={setEstEntreprise}
              label="Mon entreprise est enregistrée légalement"
              hint="Activez si vous avez un numéro d'entreprise provincial ou fédéral."
            />

            {estEntreprise && (
              <>
                <div style={{ height: '1px', background: C.border, margin: '16px 0' }} />

                <Champ label="Province d'enregistrement">
                  <select style={inp} value={provinceEntreprise} onChange={e => setProvinceEntreprise(e.target.value)}>
                    {PROVINCES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </Champ>

                <Champ label={labelNumEntreprise()}>
                  <input style={inp} value={numEntreprise} onChange={e => setNumEntreprise(e.target.value)} placeholder="Ex : 1234567890" />
                </Champ>

                <div style={{ background: C.goldLight, border: `1px solid rgba(201,169,110,0.3)`, borderRadius: '10px', padding: '14px 18px', marginBottom: '16px' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 700, color: C.gold }}>💡 Numéros de taxe fédéraux et provinciaux</p>
                  <p style={{ margin: 0, fontSize: '12px', color: C.textLight, lineHeight: 1.6 }}>
                    Si votre entreprise perçoit des taxes (TPS/TVH ou TVQ), inscrivez vos numéros ci-dessous. Ces informations apparaîtront sur vos factures.
                  </p>
                </div>

                <Champ label="Numéro de TPS / TVH" hint="Numéro d'entreprise fédéral (9 chiffres + RT0001). Ex : 123456789 RT0001">
                  <input style={inp} value={noTps} onChange={e => setNoTps(e.target.value)} placeholder="123456789 RT0001" />
                </Champ>

                {aTaxeDistincte() && (
                  <Champ label={labelTaxeProvinciale()} hint="Numéro de taxe provinciale distinct de la TPS.">
                    <input style={inp} value={noTaxeProvinciale} onChange={e => setNoTaxeProvinciale(e.target.value)} placeholder="Ex : 1234567890 TQ0001" />
                  </Champ>
                )}
              </>
            )}
          </Section>
        </div>
      )}

      {/* ══ Sécurité ══ */}
      {onglet === 'securite' && (
        <div style={{ maxWidth: '500px' }}>
          <Section titre="Sécurité du compte" icon="🔐">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: C.text }}>🔑 Mot de passe</p>
                <p style={{ margin: 0, fontSize: '12px', color: C.textLight }}>Changez votre mot de passe pour sécuriser votre compte.</p>
              </div>
              <button
                onClick={() => setShowModalMdp(true)}
                style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #c9a96e, #a07840)', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(201,169,110,0.3)' }}
              >
                Changer le mot de passe
              </button>
            </div>

            <div style={{ marginTop: '24px', padding: '16px', background: C.goldLight, border: `1px solid rgba(201,169,110,0.25)`, borderRadius: '10px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 700, color: C.gold }}>💡 Bonnes pratiques</p>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: C.textLight, lineHeight: 1.8 }}>
                <li>Utilisez au moins 8 caractères</li>
                <li>Combinez lettres, chiffres et symboles</li>
                <li>N'utilisez pas le même mot de passe sur d'autres sites</li>
              </ul>
            </div>
          </Section>

          <Section titre="Informations du compte" icon="ℹ️">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Courriel', value: email },
                { label: 'Plan actuel', value: 'Simple' },
                { label: 'Membre depuis', value: new Date().toLocaleDateString('fr-CA', { year: 'numeric', month: 'long' }) },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: '13px', color: C.textLight, fontWeight: 600 }}>{item.label}</span>
                  <span style={{ fontSize: '13px', color: C.text, fontWeight: 700 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}