// CHEMIN : src/pages/boutique/VueEnchereBoutique.tsx
// e-Vend Studio — Add-on « Enchères » (templates boutique solo) : AFFICHAGE du widget d'enchère, sans logique réseau.
// Utilisé par BlocEnchereBoutique (fiche produit, données réelles) et par la page gestionnaire « Config enchère » (aperçu en direct, données fictives).
// 6 modèles : « actuel » (suit la couleur d'accent du template) + 5 modèles repris de l'ancien e-Vend (Minimal, Professionnel teal, Sombre élégant, Luxe doré, Néon futuriste).
// Les réglages d'apparence (secondes, format de date, nombre de mises, meneur, mise en évidence, confirmation, mise minimale préremplie, réserve) viennent de boutique_reglages.

import type { CSSProperties } from 'react';
import { formaterPrix } from '../../templates/shared/devise';

export interface EnchereVue {
  prix_depart: number; mise_actuelle: number | null; prochaine_mise: number | null; increment: number; nb_mises: number;
  date_fin: string; reserve: { atteinte: boolean } | null; en_tete?: boolean; meneur?: string;
}
export interface ApparenceEnchere {
  modele: string; secondes: boolean; format_date: string | null; nb_mises: boolean; meneur: boolean; evidence: boolean;
  confirmer: boolean; libelle_confirmer: string | null; prefill: boolean; reserve: boolean;
}
export const APPARENCE_DEFAUT: ApparenceEnchere = { modele: 'actuel', secondes: true, format_date: null, nb_mises: true, meneur: false, evidence: false, confirmer: false, libelle_confirmer: null, prefill: false, reserve: true };

export const MODELES: { id: string; nom: string; desc: string; couleur: string }[] = [
  { id: 'actuel', nom: 'Actuel', desc: "Suit la couleur d'accent de votre template (par défaut)", couleur: '#c9a96e' },
  { id: 'l1', nom: 'Minimal', desc: "S'intègre dans n'importe quel thème", couleur: '#111827' },
  { id: 'l2', nom: 'Professionnel teal', desc: 'Moderne et rassurant', couleur: '#0d9488' },
  { id: 'l3', nom: 'Sombre élégant', desc: 'Premium et haut de gamme', couleur: '#7c3aed' },
  { id: 'l4', nom: 'Luxe doré', desc: 'Prestige — antiquités, collections', couleur: '#78350f' },
  { id: 'l5', nom: 'Néon futuriste', desc: 'Tech — gaming, streetwear, sneakers', couleur: '#4f46e5' },
];

interface Theme { bg: string; border: string; titre: string; texte: string; sous: string; prix: string; accent: string; btnBg: string; btnTxt: string; inputBg: string; inputBorder: string; inputTxt: string; headerBg?: string; headerTxt?: string; pills?: boolean; live?: boolean; ok: string; avert: string; err: string; fondOk: string }

const theme = (modele: string, accent: string): Theme => {
  switch (modele) {
    case 'l1': return { bg: '#fff', border: '#e5e7eb', titre: '#111827', texte: '#374151', sous: '#6b7280', prix: '#111827', accent: '#111827', btnBg: '#111827', btnTxt: '#fff', inputBg: '#f9fafb', inputBorder: '#d1d5db', inputTxt: '#111827', ok: '#166534', avert: '#b45309', err: '#b91c1c', fondOk: '#f0fdf4' };
    case 'l2': return { bg: '#fff', border: '#99f6e4', titre: '#0f766e', texte: '#0f766e', sous: '#6b7280', prix: '#0f766e', accent: '#0d9488', btnBg: '#0d9488', btnTxt: '#fff', inputBg: '#f0fdfa', inputBorder: '#99f6e4', inputTxt: '#0f172a', headerBg: '#0d9488', headerTxt: '#fff', ok: '#047857', avert: '#b45309', err: '#b91c1c', fondOk: '#ecfdf5' };
    case 'l3': return { bg: '#18181b', border: '#3f3f46', titre: '#fff', texte: '#e4e4e7', sous: '#a1a1aa', prix: '#fff', accent: '#7c3aed', btnBg: '#7c3aed', btnTxt: '#fff', inputBg: '#27272a', inputBorder: '#3f3f46', inputTxt: '#fff', headerBg: '#27272a', headerTxt: '#fff', pills: true, live: true, ok: '#6ee7b7', avert: '#fbbf24', err: '#fca5a5', fondOk: 'rgba(16,185,129,0.15)' };
    case 'l4': return { bg: '#fefce8', border: '#fde047', titre: '#78350f', texte: '#78350f', sous: '#92400e', prix: '#78350f', accent: '#92400e', btnBg: '#78350f', btnTxt: '#fef3c7', inputBg: '#fff', inputBorder: '#fcd34d', inputTxt: '#78350f', headerBg: '#78350f', headerTxt: '#fef3c7', ok: '#166534', avert: '#92400e', err: '#b91c1c', fondOk: '#f0fdf4' };
    case 'l5': return { bg: '#0a0a0f', border: '#312e81', titre: '#e0e7ff', texte: '#c7d2fe', sous: '#818cf8', prix: '#fff', accent: '#818cf8', btnBg: '#4f46e5', btnTxt: '#fff', inputBg: '#13131f', inputBorder: '#312e81', inputTxt: '#fff', pills: true, live: true, ok: '#6ee7b7', avert: '#fbbf24', err: '#fca5a5', fondOk: 'rgba(16,185,129,0.15)' };
    default: return { bg: 'rgba(255,255,255,0.05)', border: `${accent}88`, titre: '#fff', texte: 'rgba(255,255,255,0.65)', sous: 'rgba(255,255,255,0.6)', prix: '#fff', accent, btnBg: accent, btnTxt: '#000', inputBg: 'rgba(255,255,255,0.06)', inputBorder: 'rgba(255,255,255,0.2)', inputTxt: '#fff', ok: '#6ee7b7', avert: '#fbbf24', err: '#fca5a5', fondOk: 'rgba(16,185,129,0.15)' };
  }
};

const MOIS_COURT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const MOIS_LONG = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const p2 = (n: number) => String(n).padStart(2, '0');

/** Date de fin d'enchère. Sans format : « 18 nov., 19 h 12 ». Avec format : codes %H %I %l %M %S %p %e %d %m %b %B %y %Y */
export function formaterDateEnchere(iso: string, format: string | null): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    if (!format) return d.toLocaleString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const h12 = d.getHours() % 12 || 12;
    const t: Record<string, string> = {
      H: p2(d.getHours()), I: p2(h12), l: String(h12), M: p2(d.getMinutes()), S: p2(d.getSeconds()), p: d.getHours() < 12 ? 'AM' : 'PM',
      e: String(d.getDate()), d: p2(d.getDate()), m: p2(d.getMonth() + 1), b: MOIS_COURT[d.getMonth()], B: MOIS_LONG[d.getMonth()], y: String(d.getFullYear()).slice(-2), Y: String(d.getFullYear()),
    };
    return format.replace(/%([HIlMSpedmbByY])/g, (_m, c) => t[c]);
  } catch { return ''; }
}

export const resteEnchere = (ms: number, secondes: boolean) => {
  if (ms <= 0) return 'Terminée';
  const s = Math.floor(ms / 1000), j = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (j > 0) return `${j} j ${h} h ${m} min`;
  if (h > 0) return secondes ? `${h} h ${p2(m)} min ${p2(sec)} s` : `${h} h ${p2(m)} min`;
  return secondes ? `${m} min ${p2(sec)} s` : `${Math.max(m, 1)} min`;
};

export interface Mise { montant: number; date: string; encherisseur: string }
export interface PropsVue {
  enchere: EnchereVue; apparence: ApparenceEnchere; accent: string; msRestant: number;
  montant: string; setMontant: (v: string) => void; occupe: boolean; erreur: string; info: string; connecte: boolean; apercu?: boolean;
  aConfirmer: number | null; onMiser: (v?: number) => void; onConfirmer: () => void; onAnnulerConf: () => void;
  histoOuvert: boolean; histo: Mise[] | null; onToggleHisto: () => void;
}

export default function VueEnchereBoutique(p: PropsVue) {
  const { enchere: e, apparence: a, msRestant } = p;
  const th = theme(a.modele, p.accent);
  const termine = msRestant <= 0, urgent = !termine && msRestant < 5 * 60 * 1000;
  const minimum = e.prochaine_mise ?? e.prix_depart;
  const rapides = [minimum, minimum + e.increment, minimum + e.increment * 2].map(v => Math.round(v * 100) / 100);
  const valeur = p.montant !== '' ? p.montant : (a.prefill ? minimum.toFixed(2) : '');
  const prix = e.mise_actuelle !== null ? e.mise_actuelle : e.prix_depart;
  const hdr = !!th.headerBg;

  const s = Math.max(0, Math.floor(msRestant / 1000));
  const unites: [string, string][] = [[String(Math.floor(s / 86400)), 'jours'], [p2(Math.floor((s % 86400) / 3600)), 'heures'], [p2(Math.floor((s % 3600) / 60)), 'min']];
  if (a.secondes) unites.push([p2(s % 60), 'sec']);

  const carte: CSSProperties = { width: '100%', marginBottom: 12, borderRadius: 12, border: `1px solid ${th.border}`, background: th.bg, boxSizing: 'border-box', overflow: 'hidden' };
  const minuteur = (couleur: string) => <span style={{ fontSize: 13, fontWeight: 800, color: couleur }}>⏱ {resteEnchere(msRestant, a.secondes)}</span>;
  const chip = (txt: string, c: string) => <span style={{ marginLeft: 8, fontWeight: 700, color: c }}>{txt}</span>;
  const lignes: string[] = [];
  lignes.push(e.mise_actuelle === null ? 'Prix de départ · aucune mise' : (a.nb_mises ? `${e.nb_mises} mise${e.nb_mises > 1 ? 's' : ''}` : 'Mise en cours'));

  return (
    <div style={carte}>
      {hdr ? (
        <div style={{ background: th.headerBg, color: th.headerTxt, padding: '11px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
            {th.live && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />}🔨 Vente aux enchères
          </div>
          {!th.pills && minuteur(th.headerTxt || '#fff')}
          {th.pills && <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', color: th.accent }}>{termine ? 'TERMINÉE' : 'EN DIRECT'}</span>}
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '16px 16px 0' }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: th.titre }}>🔨 Vente aux enchères</div>
          {minuteur(urgent ? th.err : th.accent)}
        </div>
      )}
      <div style={{ padding: 16 }}>
        {th.pills && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {termine ? <span style={{ color: th.sous, fontWeight: 700 }}>Terminée</span> : unites.map(([v, u]) => (
              <div key={u} style={{ background: th.inputBg, border: `1px solid ${th.border}`, borderRadius: 8, padding: '6px 10px', textAlign: 'center', minWidth: 46 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: urgent ? th.err : th.titre }}>{v}</div>
                <div style={{ fontSize: 9, color: th.sous, textTransform: 'uppercase', letterSpacing: '.05em' }}>{u}</div>
              </div>))}
          </div>
        )}
        <div style={a.evidence ? { display: 'inline-block', fontSize: 34, fontWeight: 900, color: th.prix, lineHeight: 1.1, padding: '4px 12px', borderRadius: 10, background: `${th.accent}22`, border: `2px solid ${th.accent}`, boxShadow: `0 0 14px ${th.accent}44` } : { fontSize: 28, fontWeight: 900, color: th.prix, lineHeight: 1.1 }}>{formaterPrix(prix)}</div>
        <div style={{ fontSize: 12, color: th.sous, margin: '6px 0 10px' }}>
          {lignes[0]} · se termine le {formaterDateEnchere(e.date_fin, a.format_date)}
          {a.reserve && e.reserve && chip(e.reserve.atteinte ? '✓ Prix de réserve atteint' : 'Prix de réserve non atteint', e.reserve.atteinte ? th.ok : th.avert)}
        </div>
        {a.meneur && e.meneur && e.en_tete !== true && <div style={{ fontSize: 12, color: th.texte, marginBottom: 8 }}>👑 Meilleure mise : <b>{e.meneur}</b></div>}

        {e.en_tete === true && !p.info && <div style={{ padding: '8px 12px', borderRadius: 8, background: th.fondOk, color: th.ok, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>✓ Vous avez la meilleure mise.</div>}
        {p.info && <div style={{ padding: '8px 12px', borderRadius: 8, background: th.fondOk, color: th.ok, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>✓ {p.info}</div>}

        {!termine && e.en_tete !== true && (
          <>
            <div style={{ fontSize: 12, color: th.texte, marginBottom: 6 }}>Mise minimale : <b style={{ color: th.titre }}>{formaterPrix(minimum)}</b> (incrément {formaterPrix(e.increment)})</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input inputMode="decimal" value={valeur} onChange={ev => p.setMontant(ev.target.value)} onKeyDown={ev => { if (ev.key === 'Enter' && valeur && !p.occupe) p.onMiser(Number(String(valeur).replace(',', '.'))); }} placeholder={`${minimum.toFixed(2)} $ ou plus`} aria-label="Montant de votre mise"
                style={{ flex: 1, minWidth: 0, padding: '11px 12px', borderRadius: 10, border: `1px solid ${th.inputBorder}`, background: th.inputBg, color: th.inputTxt, fontSize: 16, fontWeight: 700, fontFamily: 'inherit' }} />
              <button disabled={p.occupe || !valeur} onClick={() => p.onMiser(Number(String(valeur).replace(',', '.')))} style={{ padding: '11px 18px', borderRadius: 10, border: 'none', background: th.btnBg, color: th.btnTxt, fontWeight: 800, fontSize: 14, cursor: p.occupe ? 'wait' : 'pointer', opacity: !valeur ? 0.5 : 1, fontFamily: 'inherit' }}>{p.occupe ? '⏳' : 'Miser'}</button>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
              {rapides.map(v => (
                <button key={v} disabled={p.occupe} onClick={() => p.onMiser(v)} style={{ padding: '7px 12px', borderRadius: 20, border: `1px solid ${th.accent}`, background: 'transparent', color: th.accent, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>{formaterPrix(v)}</button>
              ))}
            </div>
            {p.aConfirmer !== null && (
              <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 10, border: `1px solid ${th.accent}`, background: `${th.accent}18` }}>
                <div style={{ fontSize: 13, color: th.titre, fontWeight: 700, marginBottom: 8 }}>Vous allez miser {formaterPrix(p.aConfirmer)}. Une mise est un engagement d'achat.</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button disabled={p.occupe} onClick={p.onConfirmer} style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: th.btnBg, color: th.btnTxt, fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>{p.occupe ? '⏳' : (a.libelle_confirmer || 'Confirmer ma mise')}</button>
                  <button disabled={p.occupe} onClick={p.onAnnulerConf} style={{ padding: '9px 16px', borderRadius: 8, border: `1px solid ${th.inputBorder}`, background: 'transparent', color: th.texte, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
                </div>
              </div>
            )}
            {!p.connecte && !p.apercu && <div style={{ fontSize: 12, color: th.accent, fontWeight: 700, marginTop: 4 }}>Connectez-vous pour miser (une touche ci-dessus vous y amène).</div>}
          </>
        )}
        {p.erreur && <div style={{ marginTop: 6, color: th.err, fontSize: 13, fontWeight: 600 }}>{p.erreur}</div>}
        <div style={{ fontSize: 11, color: th.sous, marginTop: 10, lineHeight: 1.5, opacity: 0.85 }}>
          Une mise est un engagement d'achat. Une mise dans les 2 dernières minutes repousse la fin de 2 minutes. Le gagnant retrouve l'article dans son panier et dispose d'un délai limité pour payer. Suivez vos enchères dans « Mes enchères » de votre espace client.
        </div>
        <button onClick={p.onToggleHisto} style={{ marginTop: 8, background: 'none', border: 'none', color: th.accent, fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>{p.histoOuvert ? '▾ Masquer les mises' : '▸ Voir les mises'}</button>
        {p.histoOuvert && (
          <div style={{ marginTop: 8, fontSize: 13, color: th.texte }}>
            {p.histo === null ? 'Chargement…' : p.histo.length === 0 ? 'Aucune mise pour le moment.' : p.histo.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${th.border}` }}>
                <span>{m.encherisseur}</span><span><b>{formaterPrix(m.montant)}</b> <span style={{ color: th.sous }}>· {formaterDateEnchere(m.date, a.format_date)}</span></span>
              </div>))}
          </div>
        )}
      </div>
    </div>
  );
}