// src/pages/studio/ConfigTemplateEnchereFlash.tsx
// e-Vend Studio — Configurateur Enchère Flash (dashboard vendeur)

import { useState, useEffect, useCallback } from 'react';
import { CONFIG_ENCHERE_FLASH_DEFAUT, type ConfigEnchereFlash } from '../../templates/TemplateEnchereFlash';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff',
};
const label: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 700, color: '#555',
  marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em',
};
const card: React.CSSProperties = {
  background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb',
  padding: '22px 20px', marginBottom: 18,
};
const btnPrimaire: React.CSSProperties = {
  background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8,
  padding: '10px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
};
const btnSecondaire: React.CSSProperties = {
  background: '#fff', color: '#444', border: '1.5px solid #e5e7eb',
  borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
};
const btnDanger: React.CSSProperties = {
  background: '#fee2e2', color: '#dc2626', border: '1.5px solid #fca5a5',
  borderRadius: 8, padding: '7px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
};

function toLocalDatetime(iso: string) {
  if (!iso) return '';
  try { return new Date(iso).toISOString().slice(0, 16); } catch { return ''; }
}
function fromLocalDatetime(val: string) {
  if (!val) return '';
  return new Date(val).toISOString();
}

// ─── PROPS ────────────────────────────────────────────────────────────────────

interface Props {
  vendeurId: string;
  templateId?: string;
  onSauvegarde: (config: ConfigEnchereFlash) => Promise<void>;
}

type Onglet = 'produit' | 'enchere' | 'apparence' | 'contact';

// ─── COMPOSANT ────────────────────────────────────────────────────────────────

export default function ConfigTemplateEnchereFlash({ vendeurId, templateId = 'enchere-flash', onSauvegarde }: Props) {
  const [config, setConfig] = useState<ConfigEnchereFlash>(CONFIG_ENCHERE_FLASH_DEFAUT);
  const [onglet, setOnglet] = useState<Onglet>('produit');
  const [chargement, setChargement] = useState(true);
  const [sauvegarde, setSauvegarde] = useState(false);
  const [succes, setSucces] = useState('');
  const [erreur, setErreur] = useState('');
  const [montantsSuggeresInput, setMontantsSuggeresInput] = useState('25, 50, 100, 200');

  // ─── CHARGEMENT ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const charger = async () => {
      setChargement(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/studio/sites/${vendeurId}`, {
          headers: { Authorization: `Bearer ${token}` }, credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.config && Object.keys(data.config).length > 0) {
            const merged = { ...CONFIG_ENCHERE_FLASH_DEFAUT, ...data.config };
            setConfig(merged);
            setMontantsSuggeresInput((merged.montantsSuggeres || []).join(', '));
          }
        }
      } catch {}
      setChargement(false);
    };
    charger();
  }, [vendeurId]);

  const set = useCallback(<K extends keyof ConfigEnchereFlash>(champ: K, val: ConfigEnchereFlash[K]) => {
    setConfig(prev => ({ ...prev, [champ]: val }));
  }, []);

  // ─── SAUVEGARDE ─────────────────────────────────────────────────────────────
  const sauvegarder = async () => {
    setSauvegarde(true); setSucces(''); setErreur('');
    try {
      const montantsSuggeres = montantsSuggeresInput
        .split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n) && n > 0);
      const configFinale = { ...config, montantsSuggeres };
      await onSauvegarde(configFinale);
      setConfig(configFinale);
      setSucces('✅ Enchère Flash sauvegardée !');
      setTimeout(() => setSucces(''), 4000);
    } catch { setErreur('❌ Erreur lors de la sauvegarde.'); }
    finally { setSauvegarde(false); }
  };

  // ─── PHOTOS ─────────────────────────────────────────────────────────────────
  const ajouterPhoto = () => set('photos', [...config.photos, '']);
  const modifierPhoto = (i: number, val: string) => {
    const photos = [...config.photos]; photos[i] = val; set('photos', photos);
  };
  const supprimerPhoto = (i: number) => set('photos', config.photos.filter((_, idx) => idx !== i));

  if (chargement) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div><p style={{ color: '#888' }}>Chargement...</p></div>
    </div>
  );

  const onglets: { id: Onglet; label: string; icone: string }[] = [
    { id: 'produit',   label: 'Produit',   icone: '📦' },
    { id: 'enchere',   label: 'Enchère',   icone: '🔨' },
    { id: 'apparence', label: 'Apparence', icone: '🎨' },
    { id: 'contact',   label: 'Contact',   icone: '✉️' },
  ];

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px', fontFamily: "'Inter', sans-serif", color: '#1a1a2e' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>⚡ Enchère Flash</h1>
          <p style={{ fontSize: 14, color: '#888', margin: 0 }}>Un produit · Une page · Tension maximale</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href={`/site-preview?vendeurId=${vendeurId}`} target="_blank" rel="noopener noreferrer"
            style={{ ...btnSecondaire, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            👁 Aperçu
          </a>
          <button style={{ ...btnPrimaire, opacity: sauvegarde ? 0.7 : 1, minWidth: 120 }} onClick={sauvegarder} disabled={sauvegarde}>
            {sauvegarde ? '⏳...' : '💾 Sauvegarder'}
          </button>
        </div>
      </div>

      {succes && <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#16a34a', fontWeight: 600, fontSize: 14 }}>{succes}</div>}
      {erreur && <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#dc2626', fontWeight: 600, fontSize: 14 }}>{erreur}</div>}

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#f3f4f6', borderRadius: 12, padding: 4 }}>
        {onglets.map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)}
            style={{ flex: 1, padding: '9px 12px', borderRadius: 9, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit',
              background: onglet === o.id ? '#fff' : 'transparent',
              color: onglet === o.id ? '#dc2626' : '#666',
              boxShadow: onglet === o.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}>
            {o.icone} {o.label}
          </button>
        ))}
      </div>

      {/* ── ONGLET PRODUIT ──────────────────────────────────────────────────── */}
      {onglet === 'produit' && (
        <>
          <div style={card}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📦 Informations du produit</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={label}>Nom du produit *</label>
                <input style={inp} value={config.nomProduit} onChange={e => set('nomProduit', e.target.value)} placeholder="Ex: iPhone 16 Pro Max 256Go" />
              </div>
              <div>
                <label style={label}>Condition</label>
                <select style={inp} value={config.conditionProduit} onChange={e => set('conditionProduit', e.target.value)}>
                  {['Neuf', 'Comme neuf', 'Excellent', 'Très bon état', 'Bon état', 'Acceptable'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Nom de la boutique</label>
                <input style={inp} value={config.nomBoutique} onChange={e => set('nomBoutique', e.target.value)} placeholder="Ex: Ventes Alex" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={label}>Description courte</label>
                <input style={inp} value={config.descriptionCourte} onChange={e => set('descriptionCourte', e.target.value)} placeholder="Résumé accrocheur en 1 ligne" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={label}>Description complète</label>
                <textarea style={{ ...inp, minHeight: 120, resize: 'vertical' }} value={config.descriptionLongue} onChange={e => set('descriptionLongue', e.target.value)} placeholder="Détails, état, inclus, specs..." />
              </div>
            </div>
          </div>

          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>📷 Photos du produit</h3>
              <button style={{ ...btnSecondaire, padding: '6px 14px', fontSize: 13 }} onClick={ajouterPhoto}>+ Ajouter</button>
            </div>
            {config.photos.map((ph, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                {ph && <img src={ph} alt="" style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 6, flexShrink: 0, border: '1px solid #e5e7eb' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                <input style={{ ...inp, flex: 1 }} value={ph} onChange={e => modifierPhoto(i, e.target.value)} placeholder={`URL photo ${i + 1}`} />
                <button style={btnDanger} onClick={() => supprimerPhoto(i)}>✕</button>
              </div>
            ))}
            {config.photos.length === 0 && <p style={{ fontSize: 13, color: '#aaa', fontStyle: 'italic' }}>Ajoutez au moins une URL d'image.</p>}
          </div>
        </>
      )}

      {/* ── ONGLET ENCHÈRE ──────────────────────────────────────────────────── */}
      {onglet === 'enchere' && (
        <>
          <div style={card}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>💰 Prix & Mise</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={label}>Prix de départ ($) *</label>
                <input style={inp} type="number" min="0" step="0.01" value={config.prixBase} onChange={e => set('prixBase', parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <label style={label}>Prix de réserve ($) <span style={{ color: '#aaa', fontWeight: 400 }}>optionnel</span></label>
                <input style={inp} type="number" min="0" step="0.01" value={config.prixReserve || ''} onChange={e => set('prixReserve', e.target.value ? parseFloat(e.target.value) : undefined)} placeholder="Laisser vide si aucune réserve" />
                <span style={{ fontSize: 11, color: '#aaa', marginTop: 4, display: 'block' }}>La réserve n'est pas visible par les acheteurs.</span>
              </div>
              <div>
                <label style={label}>Incrément minimum ($) *</label>
                <input style={inp} type="number" min="1" step="1" value={config.incrementMin} onChange={e => set('incrementMin', parseFloat(e.target.value) || 1)} />
              </div>
              <div>
                <label style={label}>Mises rapides suggérées</label>
                <input style={inp} value={montantsSuggeresInput} onChange={e => setMontantsSuggeresInput(e.target.value)} placeholder="Ex: 25, 50, 100, 200" />
                <span style={{ fontSize: 11, color: '#aaa', marginTop: 4, display: 'block' }}>Montants ajoutés à la mise courante. Séparés par des virgules.</span>
              </div>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📅 Dates de l'enchère</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={label}>Date & heure de début *</label>
                <input style={inp} type="datetime-local" value={toLocalDatetime(config.dateDebut)} onChange={e => set('dateDebut', fromLocalDatetime(e.target.value))} />
              </div>
              <div>
                <label style={label}>Date & heure de fin *</label>
                <input style={inp} type="datetime-local" value={toLocalDatetime(config.dateFin)} onChange={e => set('dateFin', fromLocalDatetime(e.target.value))} />
              </div>
            </div>
            {config.dateDebut && config.dateFin && new Date(config.dateFin) > new Date(config.dateDebut) && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #86efac', fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
                ✅ Durée : {Math.round((new Date(config.dateFin).getTime() - new Date(config.dateDebut).getTime()) / (1000 * 60 * 60))} heures
              </div>
            )}
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📋 Politique</h3>
            <label style={label}>Politique de retour / conditions de vente</label>
            <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={config.politiqueRetour} onChange={e => set('politiqueRetour', e.target.value)} placeholder="Ex: Vente ferme — aucun retour accepté." />
          </div>
        </>
      )}

      {/* ── ONGLET APPARENCE ────────────────────────────────────────────────── */}
      {onglet === 'apparence' && (
        <>
          <div style={card}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🎨 Couleurs</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {([
                { champ: 'couleurPrincipale' as const, label2: 'Couleur principale', hint: 'Timer, prix, boutons' },
                { champ: 'couleurSecondaire' as const, label2: 'Fond de page',       hint: 'Arrière-plan sombre' },
              ]).map(({ champ, label2, hint }) => (
                <div key={champ}>
                  <label style={label}>{label2}</label>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input type="color" value={config[champ]} onChange={e => set(champ, e.target.value)}
                      style={{ width: 44, height: 36, border: '1.5px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
                    <input style={{ ...inp, flex: 1, fontFamily: 'monospace' }} value={config[champ]} onChange={e => set(champ, e.target.value)} />
                  </div>
                  <p style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>{hint}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🔤 Police</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {([
                { val: 'moderne' as const, label2: 'Moderne (Inter)' },
                { val: 'classique' as const, label2: 'Classique (Playfair)' },
                { val: 'impact' as const, label2: 'Impact (Oswald)' },
              ]).map(({ val, label2 }) => (
                <div key={val} onClick={() => set('police', val)}
                  style={{ padding: '10px 18px', borderRadius: 10, border: `2px solid ${config.police === val ? '#dc2626' : '#e5e7eb'}`, background: config.police === val ? '#fee2e2' : '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: config.police === val ? '#dc2626' : '#444' }}>
                  {label2}
                </div>
              ))}
            </div>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>🖼 Logo</h3>
            <label style={label}>URL du logo</label>
            <input style={inp} value={config.logoUrl} onChange={e => set('logoUrl', e.target.value)} placeholder="https://... (laisser vide pour utiliser 🔨)" />
            {config.logoUrl && <img src={config.logoUrl} alt="Logo" style={{ height: 40, marginTop: 8, objectFit: 'contain', borderRadius: 6 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
          </div>

          {/* Aperçu couleurs */}
          <div style={card}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>👁 Aperçu</h3>
            <div style={{ background: config.couleurSecondaire, borderRadius: 10, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>Mise courante</p>
                <p style={{ fontSize: 36, fontWeight: 900, color: config.couleurPrincipale, margin: 0 }}>1 250,00 $</p>
              </div>
              <button style={{ background: config.couleurPrincipale, color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>🔨 Miser</button>
            </div>
          </div>
        </>
      )}

      {/* ── ONGLET CONTACT ──────────────────────────────────────────────────── */}
      {onglet === 'contact' && (
        <div style={card}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>✉️ Coordonnées du vendeur</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={label}>Nom affiché</label>
              <input style={inp} value={config.nomVendeur} onChange={e => set('nomVendeur', e.target.value)} placeholder="Jean Tremblay" />
            </div>
            <div>
              <label style={label}>Courriel *</label>
              <input style={inp} type="email" value={config.email} onChange={e => set('email', e.target.value)} placeholder="vente@exemple.com" />
            </div>
            <div>
              <label style={label}>Téléphone</label>
              <input style={inp} value={config.telephone || ''} onChange={e => set('telephone', e.target.value)} placeholder="514-555-0000" />
            </div>
          </div>
        </div>
      )}

      {/* Bouton flottant bas */}
      <div style={{ position: 'sticky', bottom: 0, background: 'rgba(248,250,252,0.95)', backdropFilter: 'blur(6px)', borderTop: '1px solid #e5e7eb', margin: '0 -20px -32px', padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        {succes && <span style={{ fontSize: 14, color: '#16a34a', fontWeight: 600, alignSelf: 'center' }}>{succes}</span>}
        <button style={{ ...btnPrimaire, opacity: sauvegarde ? 0.7 : 1 }} onClick={sauvegarder} disabled={sauvegarde}>
          {sauvegarde ? '⏳ Sauvegarde...' : '💾 Sauvegarder l\'enchère'}
        </button>
      </div>
    </div>
  );
}