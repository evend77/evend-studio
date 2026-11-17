// CHEMIN : src/pages/boutique/FormulaireAdresseBoutique.tsx
// e-Vend Studio — Formulaire d'adresse de l'acheteur (templates boutique, solo). Partagé par la caisse (CaisseBoutique) et le profil (ProfilBoutique).
// Ne sert JAMAIS au multivendeur.

import React, { useState } from 'react';
import { PROVINCES } from './boutiqueAcheteurApi';

// Une adresse du carnet (carnet = /api/boutique/acheteur/<gestionnaire>/adresses)
export interface AdresseCarnet {
  id: number; libelle: string; nom: string; adresse1: string; adresse2: string; ville: string; province: string;
  code_postal: string; pays: string; telephone: string; type: 'livraison' | 'facturation'; est_principale: boolean;
}
// Une adresse saisie (pas encore dans le carnet)
export interface AdresseSaisie {
  libelle: string; nom: string; adresse1: string; adresse2: string; ville: string; province: string;
  code_postal: string; pays: string; telephone: string; type: 'livraison' | 'facturation'; est_principale: boolean;
}

export const adresseVide = (type: 'livraison' | 'facturation', nom = '', telephone = ''): AdresseSaisie => (
  { libelle: '', nom, adresse1: '', adresse2: '', ville: '', province: 'QC', code_postal: '', pays: 'Canada', telephone, type, est_principale: false });

export const ligneAdresse = (a: { adresse1: string; adresse2?: string; ville: string; province: string; code_postal: string }) =>
  `${a.adresse1}${a.adresse2 ? `, ${a.adresse2}` : ''}, ${a.ville} ${a.province} ${a.code_postal}`;

interface Props {
  initiale: AdresseSaisie;
  accent: string;
  titreBouton: string;
  afficherType?: boolean;          // profil : choisir livraison / facturation
  afficherPrincipale?: boolean;    // profil : « définir comme adresse principale »
  afficherEnregistrer?: boolean;   // caisse : « enregistrer dans mon carnet d'adresses »
  enregistrerParDefaut?: boolean;
  enCours?: boolean;
  erreur?: string;
  onValider: (a: AdresseSaisie, enregistrer: boolean) => void;
  onAnnuler?: () => void;
}

const champ: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #e7d5b8', borderRadius: 10, fontSize: 14, background: '#fff', color: '#1c1917', outline: 'none', fontFamily: 'inherit' };
const etiquette: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: '#78716c', marginBottom: 4 };

export default function FormulaireAdresseBoutique({ initiale, accent, titreBouton, afficherType, afficherPrincipale, afficherEnregistrer, enregistrerParDefaut, enCours, erreur, onValider, onAnnuler }: Props) {
  const [f, setF] = useState<AdresseSaisie>(initiale);
  const [enregistrer, setEnregistrer] = useState(enregistrerParDefaut !== false);
  const [touche, setTouche] = useState(false);
  const maj = (k: keyof AdresseSaisie, v: string | boolean) => setF(x => ({ ...x, [k]: v }));
  const manque = !f.nom.trim() || !f.adresse1.trim() || !f.ville.trim() || !f.code_postal.trim();
  const rouge = (vide: boolean): React.CSSProperties => (touche && vide ? { borderColor: '#dc2626', background: '#fef2f2' } : {});
  const soumettre = () => { setTouche(true); if (manque || enCours) return; onValider({ ...f, libelle: f.libelle.trim(), nom: f.nom.trim() }, afficherEnregistrer ? enregistrer : false); };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
      {erreur && <div style={{ gridColumn: '1 / -1', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>{erreur}</div>}
      <div><label style={etiquette}>Nom de l'adresse (facultatif)</label><input style={champ} value={f.libelle} maxLength={60} placeholder="Maison, Bureau…" onChange={e => maj('libelle', e.target.value)} /></div>
      {afficherType
        ? <div><label style={etiquette}>Type</label>
            <select style={champ} value={f.type} onChange={e => maj('type', e.target.value)}><option value="livraison">Livraison</option><option value="facturation">Facturation</option></select></div>
        : <div><label style={etiquette}>Nom complet *</label><input style={{ ...champ, ...rouge(!f.nom.trim()) }} value={f.nom} maxLength={120} autoComplete="name" onChange={e => maj('nom', e.target.value)} /></div>}
      {afficherType && <div style={{ gridColumn: '1 / -1' }}><label style={etiquette}>Nom complet *</label><input style={{ ...champ, ...rouge(!f.nom.trim()) }} value={f.nom} maxLength={120} autoComplete="name" onChange={e => maj('nom', e.target.value)} /></div>}
      <div style={{ gridColumn: '1 / -1' }}><label style={etiquette}>Adresse *</label><input style={{ ...champ, ...rouge(!f.adresse1.trim()) }} value={f.adresse1} maxLength={160} autoComplete="address-line1" placeholder="123 rue Principale" onChange={e => maj('adresse1', e.target.value)} /></div>
      <div style={{ gridColumn: '1 / -1' }}><label style={etiquette}>Appartement, suite (facultatif)</label><input style={champ} value={f.adresse2} maxLength={160} autoComplete="address-line2" onChange={e => maj('adresse2', e.target.value)} /></div>
      <div><label style={etiquette}>Ville *</label><input style={{ ...champ, ...rouge(!f.ville.trim()) }} value={f.ville} maxLength={80} autoComplete="address-level2" onChange={e => maj('ville', e.target.value)} /></div>
      <div><label style={etiquette}>Province *</label>
        <select style={champ} value={f.province} onChange={e => maj('province', e.target.value)}>{PROVINCES.map(p => <option key={p.code} value={p.code}>{p.nom}</option>)}</select></div>
      <div><label style={etiquette}>Code postal *</label><input style={{ ...champ, ...rouge(!f.code_postal.trim()) }} value={f.code_postal} maxLength={12} autoComplete="postal-code" placeholder="G0L 2K0" onChange={e => maj('code_postal', e.target.value.toUpperCase())} /></div>
      <div><label style={etiquette}>Téléphone (facultatif)</label><input style={champ} value={f.telephone} maxLength={30} autoComplete="tel" placeholder="418-000-0000" onChange={e => maj('telephone', e.target.value)} /></div>
      {afficherPrincipale && (
        <label style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#44403c', cursor: 'pointer' }}>
          <input type="checkbox" checked={f.est_principale} onChange={e => maj('est_principale', e.target.checked)} /> Définir comme adresse principale
        </label>
      )}
      {afficherEnregistrer && (
        <label style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#44403c', cursor: 'pointer' }}>
          <input type="checkbox" checked={enregistrer} onChange={e => setEnregistrer(e.target.checked)} /> Enregistrer cette adresse dans mon carnet d'adresses
        </label>
      )}
      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={soumettre} disabled={enCours}
          style={{ padding: '11px 22px', background: accent, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: enCours ? 'wait' : 'pointer', opacity: enCours ? 0.6 : 1 }}>{enCours ? '⏳…' : titreBouton}</button>
        {onAnnuler && <button onClick={onAnnuler} disabled={enCours} style={{ padding: '11px 22px', background: '#fff', color: '#78716c', border: '1px solid #e7d5b8', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>Annuler</button>}
        {touche && manque && <span style={{ alignSelf: 'center', fontSize: 12, color: '#b91c1c' }}>Remplissez les champs marqués d'un astérisque.</span>}
      </div>
    </div>
  );
}