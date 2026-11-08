// CHEMIN : src/templates/multivendeur/MVParutionCountdown.tsx
// e-Vend Studio — Add-on « Parution future » : compte à rebours d'une annonce pas encore en vente.
// Basé sur l'heure du SERVEUR (heureServeur) : changer l'horloge de l'ordinateur ne débloque rien.
// Apparence/textes : réglages du gestionnaire (Parution future dans son menu), sinon Admin Studio → Configuration date futur.

import { useEffect, useState } from 'react';

export interface ConfigParution {
  couleur_fond_debut: string; couleur_fond_fin: string; couleur_texte: string; couleur_titres: string; couleur_chiffres: string;
  couleur_bordure: string; couleur_boite_fond: string; couleur_boite_bordure: string; taille_chiffres: number; border_radius: number;
  border_width: number; ombre_active: boolean; ombre_intensite: number; couleur_fond_mobile_debut: string; couleur_fond_mobile_fin: string;
  masquer_timezone_mobile: boolean; texte_titre: string; texte_date_prefix: string; texte_timezone: string; texte_seo: string;
  texte_vente_ouverte: string; texte_atc_bloque: string; afficher_feux_artifice: boolean; duree_feux_artifice: number;
  afficher_timezone: boolean; afficher_seo: boolean; effet_vague: boolean; effet_bordure: boolean; afficher_message_atc: boolean;
  duree_disparition_bloc: number; couleur_feux_1: string; couleur_feux_2: string; couleur_feux_3: string;
}

export const CONFIG_PARUTION_DEFAUT: ConfigParution = {
  couleur_fond_debut: '#0d2b5d', couleur_fond_fin: '#0a1a3d', couleur_texte: '#e2ebff', couleur_titres: '#b7c9ff', couleur_chiffres: '#ffffff',
  couleur_bordure: '#000000', couleur_boite_fond: '#1a3a6e', couleur_boite_bordure: '#3a6aaf', taille_chiffres: 140, border_radius: 14,
  border_width: 3, ombre_active: true, ombre_intensite: 35, couleur_fond_mobile_debut: '#0d2b5d', couleur_fond_mobile_fin: '#0a1a3d',
  masquer_timezone_mobile: false, texte_titre: '⏳ Disponible dans :', texte_date_prefix: '🗓️ Mise en vente le',
  texte_timezone: '(Heure de Montréal — EST/EDT)', texte_seo: 'Ce produit sera disponible à la vente dès la fin du compte à rebours.',
  texte_vente_ouverte: '🎉 La vente est ouverte !!!', texte_atc_bloque: '', afficher_feux_artifice: true, duree_feux_artifice: 5,
  afficher_timezone: true, afficher_seo: true, effet_vague: true, effet_bordure: true, afficher_message_atc: false, duree_disparition_bloc: 5, couleur_feux_1: '#fbbf24', couleur_feux_2: '#f472b6', couleur_feux_3: '#60a5fa',
};

const caches: Record<string, ConfigParution> = {};
const enCours: Record<string, Promise<ConfigParution>> = {};
export function chargerConfigParution(gid?: number | string | null): Promise<ConfigParution> {
  const cle = String(gid || '');
  if (caches[cle]) return Promise.resolve(caches[cle]);
  if (!enCours[cle]) {
    const url = gid ? `/api/studio-forfaits/public/${gid}/parution-config` : '/api/admin/configuration/parution-futur';
    enCours[cle] = fetch(url)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { const c: ConfigParution = { ...CONFIG_PARUTION_DEFAUT, ...((d && d.config) || {}) }; caches[cle] = c; return c; })
      .catch(() => CONFIG_PARUTION_DEFAUT)
      .finally(() => { delete enCours[cle]; });
  }
  return enCours[cle];
}
export function useConfigParution(gid?: number | string | null): ConfigParution {
  const [c, setC] = useState<ConfigParution>(caches[String(gid || '')] || CONFIG_PARUTION_DEFAUT);
  useEffect(() => { let a = true; chargerConfigParution(gid).then(v => { if (a) setC(v); }); return () => { a = false; }; }, [gid]);
  return c;
}

/** Secondes restantes selon l'heure du serveur (décalage mesuré à l'arrivée des données). */
function useReste(dateIso: string, heureServeur?: string | null): number {
  const [decalage] = useState(() => (heureServeur ? Date.parse(heureServeur) - Date.now() : 0));
  const calc = () => Math.max(0, Math.ceil((Date.parse(dateIso) - (Date.now() + (Number.isFinite(decalage) ? decalage : 0))) / 1000));
  const [reste, setReste] = useState(calc);
  useEffect(() => {
    setReste(calc());
    const t = setInterval(() => setReste(calc()), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateIso]);
  return reste;
}

const p2 = (n: number) => String(n).padStart(2, '0');
const decouper = (sec: number) => ({ j: Math.floor(sec / 86400), h: Math.floor((sec % 86400) / 3600), m: Math.floor((sec % 3600) / 60), s: sec % 60 });

export function formaterDateParution(dateIso: string): string {
  try { return new Date(dateIso).toLocaleString('fr-CA', { timeZone: 'America/Toronto', dateStyle: 'full', timeStyle: 'short' }); } catch { return dateIso; }
}

const CSS = `
@keyframes mvpf-vague { 0% { transform: translateX(-120%); } 100% { transform: translateX(220%); } }
@keyframes mvpf-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.0); } 50% { box-shadow: 0 0 14px 2px rgba(255,255,255,0.28); } }
@keyframes mvpf-feu { 0% { transform: translate(0,0) scale(1); opacity: 1; } 100% { transform: translate(var(--dx),var(--dy)) scale(0.3); opacity: 0; } }
.mvpf-bloc { position: relative; overflow: hidden; }
.mvpf-vague { position: absolute; top: 0; bottom: 0; width: 35%; background: linear-gradient(100deg, transparent, rgba(255,255,255,0.10), transparent); animation: mvpf-vague 5s linear infinite; pointer-events: none; }
.mvpf-pulse { animation: mvpf-pulse 2.4s ease-in-out infinite; }
.mvpf-tz-mobile { }
@media (max-width: 640px) {
  .mvpf-bloc { background: linear-gradient(135deg, var(--m1), var(--m2)) !important; }
  .mvpf-vague, .mvpf-feux { display: none !important; }
  .mvpf-pulse { animation: none !important; }
  .mvpf-masquer-tz { display: none !important; }
  .mvpf-boite { min-width: 54px !important; padding: 8px 6px !important; }
}
`;

function Feux({ secondes, couleurs }: { secondes: number; couleurs: string[] }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => { const t = setTimeout(() => setVisible(false), Math.max(1, secondes) * 1000); return () => clearTimeout(t); }, [secondes]);
  if (!visible) return null;
  const cols = couleurs.length ? couleurs : ['#fbbf24', '#f472b6', '#60a5fa'];
  const parts = Array.from({ length: 36 }, (_, i) => {
    const a = (i / 36) * Math.PI * 2, d = 50 + (i % 4) * 22;
    return { i, dx: Math.cos(a) * d, dy: Math.sin(a) * d, c: cols[i % cols.length], delai: (i % 6) * 0.35, ox: 20 + (i % 3) * 30 };
  });
  return (
    <div className="mvpf-feux" aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {parts.map(p => (
        <span key={p.i} style={{ position: 'absolute', left: `${p.ox + (p.i % 2) * 10}%`, top: '45%', width: 6, height: 6, borderRadius: '50%', background: p.c,
          ['--dx' as any]: `${p.dx}px`, ['--dy' as any]: `${p.dy}px`, animation: `mvpf-feu 1.4s ease-out ${p.delai}s infinite` }} />
      ))}
    </div>
  );
}

interface Props {
  dateParution: string;              // ISO (UTC) renvoyé par le serveur
  gestionnaireId?: number | string | null;   // pour lire l'apparence de CETTE marketplace
  configOverride?: ConfigParution | null;    // aperçu dans la page de configuration
  heureServeur?: string | null;      // ISO — heure du serveur au moment de la réponse
  compact?: boolean;                 // petit format pour les cartes du catalogue / de la boutique
  onOuvert?: () => void;             // appelé une fois quand le compte à rebours atteint 0
}

export default function MVParutionCountdown({ dateParution, gestionnaireId, configOverride, heureServeur, compact, onOuvert }: Props) {
  const cfgChargee = useConfigParution(gestionnaireId);
  const cfg = configOverride || cfgChargee;
  const reste = useReste(dateParution, heureServeur);
  const [ouvert, setOuvert] = useState(reste <= 0);
  const [masque, setMasque] = useState(false);
  useEffect(() => { if (reste <= 0 && !ouvert) { setOuvert(true); onOuvert && onOuvert(); } }, [reste]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!ouvert || compact) return;
    const t = setTimeout(() => setMasque(true), Math.max(1, cfg.duree_disparition_bloc) * 1000);
    return () => clearTimeout(t);
  }, [ouvert, compact, cfg.duree_disparition_bloc]);

  const t = decouper(reste);
  const fond = `linear-gradient(135deg, ${cfg.couleur_fond_debut}, ${cfg.couleur_fond_fin})`;

  if (compact) {
    if (ouvert) return <div style={{ padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800, background: '#059669', color: '#fff' }}>✓ En vente</div>;
    return (
      <div title={`${cfg.texte_date_prefix} ${formaterDateParution(dateParution)}`}
        style={{ padding: '5px 8px', borderRadius: 8, background: fond, border: `1px solid ${cfg.couleur_boite_bordure}`, color: cfg.couleur_chiffres, fontSize: 11, fontWeight: 800, textAlign: 'center', lineHeight: 1.3 }}>
        <span style={{ color: cfg.couleur_titres, fontWeight: 700 }}>⏳ </span>
        {t.j > 0 ? `${t.j} j ` : ''}{p2(t.h)}:{p2(t.m)}:{p2(t.s)}
      </div>
    );
  }

  if (ouvert && masque) return null;
  return (
    <div className={`mvpf-bloc${cfg.effet_bordure && !ouvert ? ' mvpf-pulse' : ''}`}
      style={{ ['--m1' as any]: cfg.couleur_fond_mobile_debut, ['--m2' as any]: cfg.couleur_fond_mobile_fin,
        margin: '0 0 18px', padding: 18, background: fond, borderRadius: cfg.border_radius, color: cfg.couleur_texte, textAlign: 'center',
        border: `${cfg.border_width}px solid ${cfg.couleur_bordure}`, boxShadow: cfg.ombre_active ? `0 0 ${cfg.ombre_intensite}px rgba(0,0,0,0.45)` : 'none' }}>
      <style>{CSS}</style>
      {cfg.effet_vague && !ouvert && <div className="mvpf-vague" />}
      {ouvert ? (
        <>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: cfg.couleur_chiffres, position: 'relative' }}>{cfg.texte_vente_ouverte}</p>
          {cfg.afficher_feux_artifice && <Feux secondes={cfg.duree_feux_artifice} couleurs={[cfg.couleur_feux_1, cfg.couleur_feux_2, cfg.couleur_feux_3]} />}
        </>
      ) : (
        <div style={{ position: 'relative' }}>
          <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px', color: cfg.couleur_texte }}>{cfg.texte_date_prefix} <strong>{formaterDateParution(dateParution)}</strong></p>
          {cfg.afficher_timezone && <p className={cfg.masquer_timezone_mobile ? 'mvpf-masquer-tz' : ''} style={{ fontSize: 11, opacity: 0.7, margin: '0 0 10px' }}>{cfg.texte_timezone}</p>}
          <p style={{ fontSize: 14, margin: '0 0 12px', color: cfg.couleur_titres }}>{cfg.texte_titre}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            {([['jours', t.j], ['heures', t.h], ['min', t.m], ['sec', t.s]] as [string, number][]).map(([l, v]) => (
              <div key={l} className="mvpf-boite" style={{ background: cfg.couleur_boite_fond, border: `1px solid ${cfg.couleur_boite_bordure}`, borderRadius: 10, padding: '10px 12px', minWidth: 66 }}>
                <div style={{ fontSize: `${(cfg.taille_chiffres / 100) * 1.5}rem`, fontWeight: 700, color: cfg.couleur_chiffres, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{p2(v)}</div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', opacity: 0.75, color: cfg.couleur_texte, marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
          {cfg.afficher_seo && cfg.texte_seo && <p style={{ fontSize: 12, opacity: 0.85, margin: '12px 0 0' }}>{cfg.texte_seo}</p>}
        </div>
      )}
    </div>
  );
}