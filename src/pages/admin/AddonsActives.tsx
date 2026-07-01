// src/pages/admin/AddonsActives.tsx
// Liste des vendeurs avec leurs add-ons activés + montant total pour facturation

import { useState, useEffect, useCallback, useMemo } from 'react';
import { API_BASE } from '../../config/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AddonActif {
  addon_id:    string;
  nom:         string;
  prix:        string;
  periode:     string;
  categorie:   string;
  date_activation: string;
}

interface VendeurAddons {
  vendeur_id:    number;
  nom_boutique:  string;
  nom:           string;
  email:         string;
  plan:          string;
  addons:        AddonActif[];
  total_mois:    number;
}

// ─── Thème ────────────────────────────────────────────────────────────────────
const T = {
  bg: '#f0f2f5', card: '#fff', border: '#e1e4e8',
  accent: '#2d6a9f', accentLight: '#e8f2fb',
  text: '#1a2332', textLight: '#6b7280',
  success: '#16a34a', warning: '#d97706', danger: '#dc2626',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function prixMensuel(prix: string, periode: string): number {
  const p = parseFloat(prix) || 0;
  if (periode === 'an') return p / 12;
  if (prix === '0') return 0;
  return p;
}

function formatPrix(n: number): string {
  return n.toFixed(2);
}

// ─── Composant ────────────────────────────────────────────────────────────────
export default function AddonsActives({ naviguerVers }: { naviguerVers?: (p: string) => void }) {
  const [data, setData]           = useState<VendeurAddons[]>([]);
  const [loading, setLoading]     = useState(true);
  const [recherche, setRecherche] = useState('');
  const [expand, setExpand]       = useState<number | null>(null);
  const [filtre, setFiltre]       = useState<'tous' | 'avec' | 'sans'>('avec');

  // ── Charger ────────────────────────────────────────────────────────────
  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res  = await fetch(`${API_BASE}/addons/admin/addons-actives-vendeurs`, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.data || []);
    } catch (err) {
      console.error('❌ AddonsActives:', err);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  // ── Stats globales ──────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    totalVendeurs:   data.length,
    vendeurActifs:   data.filter(v => v.addons.length > 0).length,
    totalAddons:     data.reduce((s, v) => s + v.addons.length, 0),
    revenuMensuel:   data.reduce((s, v) => s + v.total_mois, 0),
  }), [data]);

  // ── Filtrer ─────────────────────────────────────────────────────────────
  const filtrés = useMemo(() => data.filter(v => {
    const m = [v.nom_boutique, v.nom, v.email].join(' ').toLowerCase().includes(recherche.toLowerCase());
    const f = filtre === 'tous' ? true : filtre === 'avec' ? v.addons.length > 0 : v.addons.length === 0;
    return m && f;
  }), [data, recherche, filtre]);

  // ── Export CSV ──────────────────────────────────────────────────────────
  function exportCSV() {
    const lignes: string[] = ['Boutique,Vendeur,Email,Add-on,Catégorie,Prix,Période,Total mensuel'];
    data.forEach(v => {
      if (v.addons.length === 0) {
        lignes.push(`"${v.nom_boutique}","${v.nom}","${v.email}",,,,,"0.00"`);
      } else {
        v.addons.forEach((a, i) => {
          lignes.push(`"${i === 0 ? v.nom_boutique : ''}","${i === 0 ? v.nom : ''}","${i === 0 ? v.email : ''}","${a.nom}","${a.categorie}","${a.prix}","${a.periode}","${i === 0 ? formatPrix(v.total_mois) : ''}"`);
        });
      }
    });
    const blob = new Blob([lignes.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `addons-actives-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏳</div>
        <p style={{ color: T.textLight }}>Chargement des add-ons activés…</p>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '28px 32px', background: T.bg, minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: T.text, margin: '0 0 4px' }}>🧩 Add-ons activés</h1>
          <p style={{ fontSize: '13px', color: T.textLight, margin: 0 }}>Vue de facturation — add-ons actifs par vendeur</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={charger} style={{ padding: '9px 16px', background: T.card, border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: T.textLight }}>🔄 Actualiser</button>
          <button onClick={exportCSV} style={{ padding: '9px 16px', background: T.accent, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: 'pointer' }}>📥 Exporter CSV</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {[
          { icon: '🏪', label: 'Vendeurs total',     val: stats.totalVendeurs },
          { icon: '✅', label: 'Avec add-ons',        val: stats.vendeurActifs },
          { icon: '🧩', label: 'Add-ons activés',     val: stats.totalAddons },
          { icon: '💰', label: 'Revenu mensuel est.', val: `${formatPrix(stats.revenuMensuel)} $CAD` },
        ].map(s => (
          <div key={s.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: '22px', margin: '0 0 4px' }}>{s.icon}</p>
            <p style={{ fontSize: '20px', fontWeight: 800, color: T.text, margin: '0 0 2px' }}>{s.val}</p>
            <p style={{ fontSize: '11px', color: T.textLight, margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="🔍 Rechercher boutique, vendeur, email…"
          style={{ flex: 1, minWidth: '200px', padding: '9px 12px', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
        <div style={{ display: 'flex', gap: '6px' }}>
          {([
            { val: 'tous', label: 'Tous' },
            { val: 'avec', label: '✅ Avec add-ons' },
            { val: 'sans', label: '○ Sans add-on' },
          ] as const).map(f => (
            <button key={f.val} onClick={() => setFiltre(f.val)}
              style={{ padding: '7px 14px', borderRadius: '20px', border: 'none', background: filtre === f.val ? T.accent : '#f0f2f5', color: filtre === f.val ? '#fff' : T.textLight, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '80px 2fr 2fr 1fr 1fr 120px', gap: '0', background: '#f8fafc', borderBottom: `2px solid ${T.border}`, padding: '12px 20px' }}>
          {['ID', 'Boutique', 'Vendeur / Email', 'Add-ons actifs', 'Total mensuel', 'Détail'].map(h => (
            <span key={h} style={{ fontSize: '11px', fontWeight: 800, color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</span>
          ))}
        </div>

        {filtrés.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: T.textLight }}>
            <p style={{ fontSize: '40px', margin: '0 0 12px' }}>🔍</p>
            <p style={{ margin: 0 }}>Aucun résultat</p>
          </div>
        ) : filtrés.map((v, idx) => (
          <div key={v.vendeur_id}>
            {/* Ligne vendeur */}
            <div
              style={{ display: 'grid', gridTemplateColumns: '80px 2fr 2fr 1fr 1fr 120px', gap: '0', padding: '14px 20px', borderBottom: `1px solid ${T.border}`, background: expand === v.vendeur_id ? '#f0f7ff' : idx % 2 === 0 ? '#fff' : '#fafafa', alignItems: 'center', cursor: v.addons.length > 0 ? 'pointer' : 'default', transition: 'background 0.15s' }}
              onClick={() => v.addons.length > 0 && setExpand(expand === v.vendeur_id ? null : v.vendeur_id)}
            >
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', color: T.accent, background: T.accentLight, padding: '3px 8px', borderRadius: '6px' }}>#{v.vendeur_id}</span>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: T.text }}>{v.nom_boutique || '—'}</p>
                <p style={{ margin: 0, fontSize: '10px', color: T.textLight, fontFamily: 'monospace' }}>{v.plan}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '13px', color: T.text }}>{v.nom}</p>
                <p style={{ margin: 0, fontSize: '11px', color: T.textLight }}>{v.email}</p>
              </div>
              <div>
                {v.addons.length === 0
                  ? <span style={{ fontSize: '11px', color: T.textLight, fontStyle: 'italic' }}>Aucun</span>
                  : <span style={{ fontSize: '13px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: T.accentLight, color: T.accent }}>{v.addons.length} add-on{v.addons.length > 1 ? 's' : ''}</span>
                }
              </div>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 800, color: v.total_mois > 0 ? T.success : T.textLight }}>
                  {v.total_mois > 0 ? `${formatPrix(v.total_mois)} $` : '—'}
                </span>
                {v.total_mois > 0 && <span style={{ fontSize: '10px', color: T.textLight, display: 'block' }}>/mois est.</span>}
              </div>
              <div>
                {v.addons.length > 0 && (
                  <button onClick={e => { e.stopPropagation(); setExpand(expand === v.vendeur_id ? null : v.vendeur_id); }}
                    style={{ padding: '5px 12px', border: `1px solid ${T.border}`, borderRadius: '8px', background: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: T.accent }}>
                    {expand === v.vendeur_id ? '▲ Fermer' : '▼ Voir'}
                  </button>
                )}
              </div>
            </div>

            {/* Détail add-ons expandé */}
            {expand === v.vendeur_id && v.addons.length > 0 && (
              <div style={{ background: '#f0f7ff', borderBottom: `1px solid ${T.border}`, padding: '0 20px 16px 40px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                      {['Add-on', 'Catégorie', 'Prix', 'Période', 'Mensuel estimé', 'Activé le'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {v.addons.map((a, i) => (
                      <tr key={a.addon_id} style={{ borderBottom: i < v.addons.length - 1 ? `1px solid ${T.border}` : 'none', background: i % 2 === 0 ? 'rgba(255,255,255,0.6)' : 'transparent' }}>
                        <td style={{ padding: '9px 12px', fontSize: '13px', fontWeight: 600, color: T.text }}>{a.nom}</td>
                        <td style={{ padding: '9px 12px', fontSize: '12px', color: T.textLight }}>{a.categorie || '—'}</td>
                        <td style={{ padding: '9px 12px', fontSize: '13px', fontWeight: 700, color: T.text }}>
                          {parseFloat(a.prix) === 0 ? <span style={{ color: T.success, fontWeight: 700 }}>Gratuit</span> : `${a.prix} $CAD`}
                        </td>
                        <td style={{ padding: '9px 12px', fontSize: '12px', color: T.textLight }}>{a.periode}</td>
                        <td style={{ padding: '9px 12px', fontSize: '13px', fontWeight: 700, color: T.accent }}>
                          {prixMensuel(a.prix, a.periode) > 0 ? `${formatPrix(prixMensuel(a.prix, a.periode))} $` : '—'}
                        </td>
                        <td style={{ padding: '9px 12px', fontSize: '11px', color: T.textLight }}>
                          {a.date_activation ? new Date(a.date_activation).toLocaleDateString('fr-CA') : '—'}
                        </td>
                      </tr>
                    ))}
                    {/* Ligne total */}
                    <tr style={{ borderTop: `2px solid ${T.border}`, background: 'rgba(45,106,159,0.05)' }}>
                      <td colSpan={4} style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 800, color: T.text }}>Total mensuel estimé</td>
                      <td style={{ padding: '10px 12px', fontSize: '15px', fontWeight: 800, color: T.success }}>{formatPrix(v.total_mois)} $CAD</td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}

        {/* Footer total global */}
        {filtrés.length > 0 && (
          <div style={{ padding: '14px 20px', background: '#1a2436', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
              {filtrés.filter(v => v.addons.length > 0).length} vendeur(s) avec add-ons · {filtrés.reduce((s, v) => s + v.addons.length, 0)} add-ons total
            </span>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#4ade80' }}>
              Total filtré : {formatPrix(filtrés.reduce((s, v) => s + v.total_mois, 0))} $CAD/mois
            </span>
          </div>
        )}
      </div>
    </div>
  );
}