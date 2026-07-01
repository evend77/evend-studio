// pages/gestionnaire/MethodesExpedition.tsx
// Config expédition vendeur — 4 modes + combine shipping + zones province
import React, { useState, useEffect, useCallback } from 'react';

const API = 'https://evend-multivendeur-api.onrender.com';

const getToken = () => localStorage.getItem('token');

const PROVINCES = [
  { code: 'AB', nom: 'Alberta' },
  { code: 'BC', nom: 'Colombie-Britannique' },
  { code: 'MB', nom: 'Manitoba' },
  { code: 'NB', nom: 'Nouveau-Brunswick' },
  { code: 'NL', nom: 'Terre-Neuve-et-Labrador' },
  { code: 'NS', nom: 'Nouvelle-Écosse' },
  { code: 'ON', nom: 'Ontario' },
  { code: 'PE', nom: 'Île-du-Prince-Édouard' },
  { code: 'QC', nom: 'Québec' },
  { code: 'SK', nom: 'Saskatchewan' },
  { code: 'NT', nom: 'Territoires du Nord-Ouest' },
  { code: 'NU', nom: 'Nunavut' },
  { code: 'YT', nom: 'Yukon' },
];

const TRANSPORTEURS = [
  { id: 14, nom: 'Livraison gratuite',           logo: '🎁', desc: 'Gratuit pour tous les clients ou selon montant minimum' },
  { id: 1,  nom: 'Canada Post / Postes Canada',  logo: '📮', desc: 'Service postal national, fiable et économique' },
  { id: 2,  nom: 'Purolator',                    logo: '🚚', desc: 'Livraison express, excellent pour les colis urgents' },
  { id: 3,  nom: 'FedEx Canada',                 logo: '✈️', desc: 'Livraison internationale et express' },
  { id: 4,  nom: 'UPS Canada',                   logo: '📦', desc: 'Solutions de livraison complètes' },
  { id: 5,  nom: 'Intelcom Courrier',             logo: '📬', desc: 'Spécialiste des livraisons e-commerce au Québec' },
  { id: 6,  nom: 'DHL Express Canada',            logo: '🌍', desc: 'Expert en livraison internationale rapide' },
  { id: 7,  nom: 'GLS Canada',                   logo: '🚛', desc: 'Solutions abordables pour colis' },
  { id: 8,  nom: 'CanPar',                        logo: '🇨🇦', desc: 'Services de messagerie canadienne' },
  { id: 9,  nom: 'Loomis Express',               logo: '📦', desc: 'Réseau de messagerie pancanadien' },
  { id: 10, nom: 'Transport A. Bélanger',         logo: '🚚', desc: 'Transporteur local spécialisé Québec' },
  { id: 11, nom: 'Groupe Robert',                logo: '🏭', desc: 'Transport lourd et logistique' },
  { id: 12, nom: 'Livraison locale (marché)',     logo: '🛵', desc: 'Livraison locale pour votre région' },
  { id: 13, nom: 'Ramassage sur place',           logo: '🏪', desc: 'Le client vient chercher sa commande' },
];

const MODES_CALCUL = [
  { value: 'fixe',    label: 'Frais fixe',              desc: 'Un prix fixe peu importe le poids' },
  { value: 'fixe_kg', label: 'Frais fixe + par kg',     desc: 'Prix fixe + supplément selon le poids' },
  { value: 'kg',      label: 'Frais par kg seulement',  desc: 'Prix calculé uniquement selon le poids' },
  { value: 'zone',    label: 'Frais par province',       desc: 'Prix différent selon la province de livraison' },
];

interface Config {
  transporteur_id: number;
  actif: boolean;
  mode_calcul: string;
  frais_fixes: number | null;
  frais_par_kg: number | null;
  gratuit_superieur: number | null;
  delais_estime: string;
  combine_shipping: boolean;
  combine_frais_fixe_unique: boolean;
  combine_kg_additionne: boolean;
  frais_zones: Record<string, string | null>;
}

interface MethodesExpeditionProps {
  gestionnaireId: number;
  onRetour?: () => void;
}

const C = {
  bg: '#f4f6f8', white: '#fff', border: '#e1e3e5',
  teal: '#537373', tealLight: '#e8f0f0', tealDark: '#3d5a5a',
  green: '#008060', greenLight: '#f0fdf4', greenBorder: '#86efac',
  red: '#dc2626', redLight: '#fef2f2', redBorder: '#fca5a5',
  yellow: '#f59e0b', yellowLight: '#fffbeb', yellowBorder: '#fde68a',
  text: '#1a2332', textLight: '#6b7280', textMuted: '#9ca3af',
};

export default function MethodesExpedition({ gestionnaireId, onRetour }: MethodesExpeditionProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actifs, setActifs] = useState<number[]>([]);
  const [configs, setConfigs] = useState<Map<number, Config>>(new Map());
  const [enEdition, setEnEdition] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; texte: string } | null>(null);

  // Charger configs existantes
  useEffect(() => {
    if (!gestionnaireId) return;
    setLoading(true);
    fetch(`${API}/api/vendeurs/${gestionnaireId}/methodes-expedition`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    .then(r => r.ok ? r.json() : [])
    .then(data => {
      const a: number[] = [];
      const c = new Map<number, Config>();
      data.forEach((item: any) => {
        a.push(item.transporteur_id);
        c.set(item.transporteur_id, {
          transporteur_id: item.transporteur_id,
          actif: item.actif,
          mode_calcul: item.mode_calcul || 'fixe',
          frais_fixes: item.frais_fixes ? parseFloat(item.frais_fixes) : null,
          frais_par_kg: item.frais_par_kg ? parseFloat(item.frais_par_kg) : null,
          gratuit_superieur: item.gratuit_superieur ? parseFloat(item.gratuit_superieur) : null,
          delais_estime: item.delais_estime || '',
          combine_shipping: item.combine_shipping || false,
          combine_frais_fixe_unique: item.combine_frais_fixe_unique !== false,
          combine_kg_additionne: item.combine_kg_additionne !== false,
          frais_zones: item.frais_zones || {},
        });
      });
      setActifs(a);
      setConfigs(c);
    })
    .catch(() => {})
    .finally(() => setLoading(false));
  }, [gestionnaireId]);

  const configParDefaut = (transporteurId: number): Config => ({
    transporteur_id: transporteurId,
    actif: true,
    mode_calcul: transporteurId === 14 ? 'fixe' : 'fixe',
    frais_fixes: transporteurId === 14 ? 0 : null,
    frais_par_kg: null,
    gratuit_superieur: null,
    delais_estime: TRANSPORTEURS.find(t => t.id === transporteurId)?.desc || '',
    combine_shipping: false,
    combine_frais_fixe_unique: true,
    combine_kg_additionne: true,
    frais_zones: {},
  });

  const toggleActif = useCallback((id: number) => {
    setActifs(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      setConfigs(c => { const m = new Map(c); if (!m.has(id)) m.set(id, configParDefaut(id)); return m; });
      return [...prev, id];
    });
  }, []);

  const updateConfig = useCallback((id: number, field: keyof Config, value: any) => {
    setConfigs(prev => {
      const m = new Map(prev);
      const cur = m.get(id) || configParDefaut(id);
      m.set(id, { ...cur, [field]: value });
      return m;
    });
  }, []);

  const updateZone = useCallback((id: number, province: string, value: string) => {
    setConfigs(prev => {
      const m = new Map(prev);
      const cur = m.get(id) || configParDefaut(id);
      const zones = { ...(cur.frais_zones || {}) };
      if (value === '') { delete zones[province]; }
      else { zones[province] = value === 'non' ? null : value; }
      m.set(id, { ...cur, frais_zones: zones });
      return m;
    });
  }, []);

  // Validation avant sauvegarde
  const valider = (id: number, cfg: Config): string | null => {
    const mode = cfg.mode_calcul;
    if (mode === 'fixe' || mode === 'fixe_kg') {
      if (cfg.frais_fixes === null && id !== 14) return 'Frais fixe requis';
    }
    if (mode === 'kg' || mode === 'fixe_kg') {
      if (!cfg.frais_par_kg) return 'Frais par kg requis';
    }
    if (mode === 'zone') {
      const manquantes = PROVINCES.filter(p => !(p.code in (cfg.frais_zones || {})));
      if (manquantes.length > 0) return `Remplissez toutes les provinces (manque: ${manquantes.map(p => p.code).join(', ')})`;
    }
    return null;
  };

  const sauvegarder = async () => {
    // Valider toutes les configs actives
    for (const id of actifs) {
      const cfg = configs.get(id);
      if (!cfg) continue;
      const erreur = valider(id, cfg);
      if (erreur) {
        const t = TRANSPORTEURS.find(t => t.id === id);
        setMessage({ type: 'error', texte: `❌ ${t?.nom}: ${erreur}` });
        return;
      }
    }

    setSaving(true);
    setMessage(null);

    const dataToSave = actifs.map(id => {
      const cfg = configs.get(id) || configParDefaut(id);
      return {
        transporteur_id: id,
        actif: true,
        mode_calcul: cfg.mode_calcul,
        frais_fixes: cfg.frais_fixes,
        frais_par_kg: cfg.frais_par_kg,
        gratuit_superieur: cfg.gratuit_superieur,
        delais_estime: cfg.delais_estime,
        combine_shipping: cfg.combine_shipping,
        combine_frais_fixe_unique: cfg.combine_frais_fixe_unique,
        combine_kg_additionne: cfg.combine_kg_additionne,
        frais_zones: cfg.mode_calcul === 'zone' ? cfg.frais_zones : null,
      };
    });

    try {
      const r = await fetch(`${API}/api/vendeurs/${gestionnaireId}/methodes-expedition`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ methodes: dataToSave })
      });
      if (r.ok) {
        setMessage({ type: 'success', texte: '✅ Méthodes d\'expédition sauvegardées!' });
        setEnEdition(null);
        setTimeout(() => setMessage(null), 3000);
      } else {
        const err = await r.json();
        setMessage({ type: 'error', texte: `❌ ${err.message || 'Erreur'}` });
      }
    } catch {
      setMessage({ type: 'error', texte: '❌ Erreur de connexion' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ padding: '60px', textAlign: 'center', color: C.textLight }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
      Chargement des méthodes d'expédition...
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: '100vh', paddingBottom: '80px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>

        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              {onRetour && (
                <button onClick={onRetour} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.teal, fontSize: '14px', fontWeight: 600, padding: 0 }}>
                  ← Retour
                </button>
              )}
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: C.text }}>🚚 Méthodes d'expédition</h1>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: C.textLight }}>
              Configurez vos options de livraison. Les acheteurs choisissent parmi vos méthodes actives au checkout.
            </p>
          </div>
          <button
            onClick={sauvegarder}
            disabled={saving}
            style={{ background: `linear-gradient(135deg, ${C.teal}, ${C.tealDark})`, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1, boxShadow: '0 2px 8px rgba(83,115,115,0.3)' }}
          >
            {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder tout'}
          </button>
        </div>

        {/* Message */}
        {message && (
          <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: 600, background: message.type === 'success' ? C.greenLight : C.redLight, border: `1px solid ${message.type === 'success' ? C.greenBorder : C.redBorder}`, color: message.type === 'success' ? C.green : C.red }}>
            {message.texte}
          </div>
        )}

        {/* Info */}
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#1e40af', display: 'flex', gap: '10px' }}>
          <span style={{ flexShrink: 0 }}>ℹ️</span>
          <span>Activez les transporteurs que vous utilisez et configurez leur mode de calcul. Les acheteurs voient uniquement vos méthodes actives avec le prix calculé automatiquement.</span>
        </div>

        {/* Liste transporteurs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {TRANSPORTEURS.map(t => {
            const estActif = actifs.includes(t.id);
            const cfg = configs.get(t.id);
            const enEd = enEdition === t.id;

            return (
              <div key={t.id} style={{ background: C.white, borderRadius: '12px', border: `2px solid ${estActif ? C.teal : C.border}`, overflow: 'hidden', transition: 'all 0.2s', boxShadow: estActif ? '0 2px 12px rgba(83,115,115,0.15)' : 'none' }}>

                {/* En-tête transporteur */}
                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', background: estActif ? C.tealLight : C.white, cursor: 'pointer' }}
                  onClick={() => toggleActif(t.id)}>
                  <div style={{ fontSize: '32px', flexShrink: 0 }}>{t.logo}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '15px', color: C.text }}>{t.nom}</span>
                      {estActif && <span style={{ background: C.green, color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>✓ Actif</span>}
                      {t.id === 14 && <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', border: '1px solid #fde68a' }}>Recommandé produits numériques</span>}
                    </div>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: C.textLight }}>{t.desc}</p>
                  </div>
                  {/* Toggle switch */}
                  <div style={{ width: '44px', height: '24px', borderRadius: '12px', background: estActif ? C.teal : '#d1d5db', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: estActif ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                </div>

                {/* Section config (visible si actif) */}
                {estActif && cfg && (
                  <div style={{ borderTop: `1px solid ${C.border}`, padding: '16px 20px', background: '#fafbfc' }}>
                    {!enEd ? (
                      /* ── RÉSUMÉ ── */
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '13px', color: C.textLight }}>
                            <strong>Mode:</strong> {MODES_CALCUL.find(m => m.value === cfg.mode_calcul)?.label || cfg.mode_calcul}
                          </span>
                          {(cfg.mode_calcul === 'fixe' || cfg.mode_calcul === 'fixe_kg') && cfg.frais_fixes !== null && (
                            <span style={{ fontSize: '13px', color: C.textLight }}><strong>💰 Frais fixe:</strong> {cfg.frais_fixes} $</span>
                          )}
                          {(cfg.mode_calcul === 'kg' || cfg.mode_calcul === 'fixe_kg') && cfg.frais_par_kg && (
                            <span style={{ fontSize: '13px', color: C.textLight }}><strong>⚖️ Par kg:</strong> {cfg.frais_par_kg} $/kg</span>
                          )}
                          {cfg.mode_calcul === 'zone' && (
                            <span style={{ fontSize: '13px', color: C.textLight }}><strong>🗺️ Zones:</strong> {Object.keys(cfg.frais_zones || {}).length} provinces configurées</span>
                          )}
                          {cfg.gratuit_superieur && (
                            <span style={{ fontSize: '13px', color: C.green, fontWeight: 600 }}>🎁 Gratuit dès {cfg.gratuit_superieur} $</span>
                          )}
                          {cfg.combine_shipping && (
                            <span style={{ fontSize: '13px', color: '#7c3aed', fontWeight: 600 }}>📦 Combine shipping actif</span>
                          )}
                        </div>
                        <button onClick={() => setEnEdition(t.id)}
                          style={{ background: 'none', border: `1px solid ${C.teal}`, color: C.teal, borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                          ⚙️ Configurer
                        </button>
                      </div>
                    ) : (
                      /* ── FORMULAIRE CONFIG ── */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        {/* Mode de calcul */}
                        <div>
                          <label style={s.label}>Mode de calcul *</label>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '6px' }}>
                            {MODES_CALCUL.filter(m => t.id === 14 ? m.value === 'fixe' : true).map(mode => (
                              <div key={mode.value}
                                onClick={() => updateConfig(t.id, 'mode_calcul', mode.value)}
                                style={{ padding: '10px 14px', borderRadius: '8px', border: `2px solid ${cfg.mode_calcul === mode.value ? C.teal : C.border}`, background: cfg.mode_calcul === mode.value ? C.tealLight : C.white, cursor: 'pointer', transition: 'all 0.15s' }}>
                                <div style={{ fontWeight: 700, fontSize: '13px', color: cfg.mode_calcul === mode.value ? C.tealDark : C.text }}>{mode.label}</div>
                                <div style={{ fontSize: '11px', color: C.textMuted, marginTop: '2px' }}>{mode.desc}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Champs selon le mode */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                          {/* Frais fixe */}
                          {(cfg.mode_calcul === 'fixe' || cfg.mode_calcul === 'fixe_kg') && (
                            <div>
                              <label style={s.label}>Frais fixe ($) {t.id !== 14 && '*'}</label>
                              <input type="number" step="0.01" min="0"
                                value={cfg.frais_fixes ?? ''}
                                onChange={e => updateConfig(t.id, 'frais_fixes', e.target.value ? parseFloat(e.target.value) : null)}
                                placeholder="9.99" style={s.input} />
                            </div>
                          )}
                          {/* Frais par kg */}
                          {(cfg.mode_calcul === 'kg' || cfg.mode_calcul === 'fixe_kg') && (
                            <div>
                              <label style={s.label}>Frais par kg ($/kg) *</label>
                              <input type="number" step="0.01" min="0"
                                value={cfg.frais_par_kg ?? ''}
                                onChange={e => updateConfig(t.id, 'frais_par_kg', e.target.value ? parseFloat(e.target.value) : null)}
                                placeholder="2.50" style={s.input} />
                            </div>
                          )}
                          {/* Gratuit dès */}
                          <div>
                            <label style={s.label}>🎁 Livraison gratuite dès ($)</label>
                            <input type="number" step="0.01" min="0"
                              value={cfg.gratuit_superieur ?? ''}
                              onChange={e => updateConfig(t.id, 'gratuit_superieur', e.target.value ? parseFloat(e.target.value) : null)}
                              placeholder="50.00 (optionnel)" style={s.input} />
                          </div>
                          {/* Délais */}
                          <div>
                            <label style={s.label}>⏱️ Délais estimés</label>
                            <input type="text"
                              value={cfg.delais_estime}
                              onChange={e => updateConfig(t.id, 'delais_estime', e.target.value)}
                              placeholder="2-5 jours ouvrables" style={s.input} />
                          </div>
                        </div>

                        {/* Frais par province */}
                        {cfg.mode_calcul === 'zone' && (
                          <div>
                            <label style={s.label}>🗺️ Frais par province (toutes requises) *</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '8px' }}>
                              {PROVINCES.map(p => {
                                const val = cfg.frais_zones?.[p.code];
                                const estNon = val === null;
                                const estVide = val === undefined;
                                return (
                                  <div key={p.code} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', background: estNon ? C.redLight : estVide ? C.yellowLight : C.greenLight, border: `1px solid ${estNon ? C.redBorder : estVide ? C.yellowBorder : C.greenBorder}` }}>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: C.text, width: '28px', flexShrink: 0 }}>{p.code}</span>
                                    <span style={{ fontSize: '11px', color: C.textLight, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nom}</span>
                                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                      <input type="number" step="0.01" min="0"
                                        value={estNon ? '' : (val || '')}
                                        disabled={estNon}
                                        onChange={e => updateZone(t.id, p.code, e.target.value)}
                                        placeholder="0.00"
                                        style={{ ...s.input, width: '70px', padding: '4px 6px', fontSize: '12px', opacity: estNon ? 0.5 : 1 }} />
                                      <button
                                        onClick={() => updateZone(t.id, p.code, estNon ? '' : 'non')}
                                        title={estNon ? 'Activer cette province' : 'Ne pas expédier'}
                                        style={{ padding: '4px 6px', fontSize: '11px', borderRadius: '4px', border: `1px solid ${estNon ? C.green : C.red}`, background: estNon ? C.greenLight : C.redLight, color: estNon ? C.green : C.red, cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                        {estNon ? '✓ ON' : '✕ OFF'}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <p style={{ fontSize: '11px', color: C.textMuted, marginTop: '6px' }}>
                              Laissez 0 pour gratuit. Cliquez ✕ OFF pour ne pas expédier dans cette province.
                            </p>
                          </div>
                        )}

                        {/* Combine shipping */}
                        {t.id !== 13 && t.id !== 14 && (
                          <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '10px', padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                              <input type="checkbox" id={`combine_${t.id}`}
                                checked={cfg.combine_shipping}
                                onChange={e => updateConfig(t.id, 'combine_shipping', e.target.checked)}
                                style={{ width: '16px', height: '16px', accentColor: '#7c3aed', cursor: 'pointer' }} />
                              <label htmlFor={`combine_${t.id}`} style={{ fontWeight: 700, fontSize: '14px', color: '#5b21b6', cursor: 'pointer' }}>
                                📦 Offrir le Combine Shipping
                              </label>
                            </div>
                            {cfg.combine_shipping && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '26px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <input type="checkbox" id={`fixe_unique_${t.id}`}
                                    checked={cfg.combine_frais_fixe_unique}
                                    onChange={e => updateConfig(t.id, 'combine_frais_fixe_unique', e.target.checked)}
                                    style={{ width: '14px', height: '14px', accentColor: '#7c3aed', cursor: 'pointer' }} />
                                  <label htmlFor={`fixe_unique_${t.id}`} style={{ fontSize: '13px', color: '#6d28d9', cursor: 'pointer' }}>
                                    Frais fixe chargé une seule fois (peu importe le nombre d'articles)
                                  </label>
                                </div>
                                {(cfg.mode_calcul === 'kg' || cfg.mode_calcul === 'fixe_kg') && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input type="checkbox" id={`kg_add_${t.id}`}
                                      checked={cfg.combine_kg_additionne}
                                      onChange={e => updateConfig(t.id, 'combine_kg_additionne', e.target.checked)}
                                      style={{ width: '14px', height: '14px', accentColor: '#7c3aed', cursor: 'pointer' }} />
                                    <label htmlFor={`kg_add_${t.id}`} style={{ fontSize: '13px', color: '#6d28d9', cursor: 'pointer' }}>
                                      Additionner le poids de tous les articles
                                      {!cfg.combine_kg_additionne && ' (sinon: poids du plus lourd seulement)'}
                                    </label>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Boutons */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => setEnEdition(null)}
                            style={{ background: C.teal, color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                            ✓ Terminé
                          </button>
                          <button onClick={() => { setConfigs(p => { const m = new Map(p); m.set(t.id, configParDefaut(t.id)); return m; }); setEnEdition(null); }}
                            style={{ background: 'none', border: `1px solid ${C.border}`, color: C.textLight, borderRadius: '6px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer' }}>
                            🔄 Réinitialiser
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Récap */}
        {actifs.length > 0 && (
          <div style={{ marginTop: '20px', background: C.white, borderRadius: '12px', border: `1px solid ${C.border}`, padding: '16px 20px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: C.text }}>📋 Vos méthodes actives</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {actifs.map(id => {
                const t = TRANSPORTEURS.find(t => t.id === id);
                const cfg = configs.get(id);
                return (
                  <div key={id} style={{ padding: '6px 12px', background: C.tealLight, borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: C.tealDark, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{t?.logo}</span>
                    <span>{t?.nom}</span>
                    {cfg?.mode_calcul === 'fixe' && cfg.frais_fixes !== null && (
                      <span style={{ background: C.teal, color: '#fff', padding: '1px 6px', borderRadius: '10px', fontSize: '11px' }}>{cfg.frais_fixes} $</span>
                    )}
                    {cfg?.mode_calcul === 'zone' && <span style={{ background: C.teal, color: '#fff', padding: '1px 6px', borderRadius: '10px', fontSize: '11px' }}>Zones</span>}
                    {cfg?.gratuit_superieur && <span style={{ background: C.green, color: '#fff', padding: '1px 6px', borderRadius: '10px', fontSize: '11px' }}>Gratuit dès {cfg.gratuit_superieur}$</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Styles communs
const s = {
  label: { display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.04em' },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #e1e3e5', borderRadius: '6px', fontSize: '14px', color: '#1a2332', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' },
};
