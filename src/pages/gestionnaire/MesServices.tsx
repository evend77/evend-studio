// src/pages/gestionnaire/MesServices.tsx
// e-Vend Studio — Page "Mes services"
// Affiche le détail complet de l'abonnement mensuel du gestionnaire :
// forfait de base + options actives + taxes TPS/TVQ

import React, { useState, useEffect } from 'react';
import FacturePopupAbonnement from '../../components/FacturePopupAbonnement';

interface Props {
  gestionnaireId: number;
}

interface Ligne {
  id: number;
  type: string;
  code: string | null;
  nom: string;
  prix_ht: number;
  actif: boolean;
}

interface Abonnement {
  id: number;
  statut: string;
  essai_fin: string | null;
  periode_debut: string | null;
  periode_fin: string | null;
  stripe_subscription_id: string | null;
  forfait_nom: string | null;
  jours_essai_restants: number | null;
}

interface Totaux {
  montant_ht: number;
  tps: number;
  tvq: number;
  total: number;
}

interface OptionDispo {
  id: number;
  code: string;
  nom: string;
  description: string;
  prix_ht: number;
  activee: boolean;
  taxes: { tps: number; tvq: number; total: number };
}

interface FactureHistorique {
  id: number;
  numero_facture: string | null;
  statut: string;
  montant_ht: number | null;
  tps: number | null;
  tvq: number | null;
  montant_total: number | null;
  periode_debut: string | null;
  periode_fin: string | null;
  created_at: string;
}

type Vue = 'services' | 'options' | 'factures';

// Miroir du catalogue défini dans BrandingEtOptions.tsx — nécessaire ici pour
// transformer les options actives (table options_gestionnaire) en lignes de
// facturation affichables, puisque ce système est séparé de abonnements_studio.
const ADDONS_CATALOGUE: { id: string; nom: string; prix_ht: number }[] = [
  { id: 'cacher_propulse',  nom: 'Cacher le branding',       prix_ht: 2 },
  { id: 'verificateur_age', nom: "Vérificateur d'âge",       prix_ht: 5 },
  { id: 'popup_annonce',    nom: 'Popup Annonce',            prix_ht: 3 },
];

export default function MesServices({ gestionnaireId }: Props) {
  const [abonnement, setAbonnement] = useState<Abonnement | null>(null);
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [totaux, setTotaux] = useState<Totaux | null>(null);
  const [options, setOptions] = useState<OptionDispo[]>([]);
  const [factures, setFactures] = useState<FactureHistorique[]>([]);
  const [factureOuverte, setFactureOuverte] = useState<number | null>(null);
  const [revenuPubMois, setRevenuPubMois] = useState<{ clics: number; revenu: number; montant_par_clic: number } | null>(null);
  const [factureSelectionnee, setFactureSelectionnee] = useState<number | null>(null);
  const [revenuPubFacture, setRevenuPubFacture] = useState<Record<number, { clics: number; revenu: number }>>({});
  const [vue, setVue] = useState<Vue>('services');
  const [chargement, setChargement] = useState(true);
  const [actionEnCours, setActionEnCours] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; texte: string } | null>(null);

  const token = () => localStorage.getItem('token');

  const charger = async () => {
    setChargement(true);
    try {
      const [aboRes, optRes, facturesRes, addonsRes, blocsRes] = await Promise.all([
        fetch('/api/abonnements-studio/mon-abonnement', {
          headers: { Authorization: `Bearer ${token()}` },
        }),
        fetch('/api/abonnements-studio/options-disponibles', {
          headers: { Authorization: `Bearer ${token()}` },
        }),
        fetch('/api/abonnements-studio/mes-factures', {
          headers: { Authorization: `Bearer ${token()}` },
        }),
        // 🟢 Add-ons payants (Branding & options) — système séparé de abonnements_studio,
        // il faut les fusionner ici pour que "Mes services" reflète la vraie facture.
        fetch(`/api/gestionnaires/${gestionnaireId}/options`, {
          headers: { Authorization: `Bearer ${token()}` },
        }),
        // 🟢 Blocs de messagerie achetés ce cycle — encore un système séparé.
        fetch(`/api/messagerie-contact/gestionnaire/${gestionnaireId}/facturation-cycle`, {
          headers: { Authorization: `Bearer ${token()}` },
        }),
      ]);
      const aboData = await aboRes.json();
      const optData = await optRes.json();
      const facturesData = await facturesRes.json();
      const addonsData = await addonsRes.json().catch(() => ({}));
      const blocsData = await blocsRes.json().catch(() => ({ achats: [] }));

      // Transformer les options actives (booléens) en lignes de facturation affichables
      const lignesAddons: Ligne[] = ADDONS_CATALOGUE
        .filter(a => !!addonsData?.[a.id])
        .map(a => ({ id: -1000 - ADDONS_CATALOGUE.indexOf(a), type: 'addon', code: a.id, nom: a.nom, prix_ht: a.prix_ht, actif: true }));

      // Chaque bloc de messages acheté ce cycle = sa propre ligne, pour la transparence
      const lignesBlocs: Ligne[] = (blocsData.achats || []).map((a: any, i: number) => ({
        id: -2000 - i,
        type: 'addon',
        code: 'bloc_messagerie',
        nom: `Bloc de ${a.quantite_messages} messages (formulaire de contact)`,
        prix_ht: parseFloat(a.prix_ht),
        actif: true,
      }));

      const lignesCombinees = [...(aboData.lignes || []), ...lignesAddons, ...lignesBlocs];
      setAbonnement(aboData.abonnement);
      setLignes(lignesCombinees);

      // Si un vrai abonnement Stripe existe, ses totaux ne comptent pas les add-ons —
      // on recalcule toujours localement à partir de TOUTES les lignes combinées.
      const montantHt = lignesCombinees.reduce((s, l) => s + parseFloat(String(l.prix_ht || 0)), 0);
      if (montantHt > 0) {
        const tps = montantHt * 0.05;
        const tvq = montantHt * 0.09975;
        setTotaux({ montant_ht: montantHt, tps, tvq, total: montantHt + tps + tvq });
      } else {
        setTotaux(null);
      }

      setOptions(optData || []);
      setFactures(facturesData.factures || []);
    } catch {
      setMessage({ type: 'error', texte: 'Erreur lors du chargement.' });
    }
    setChargement(false);
  };

  useEffect(() => { charger(); }, []);

  // Revenu pub du cycle de facturation en cours (periode_debut réel de Stripe → aujourd'hui).
  // Pendant l'essai gratuit, aucun abonnement Stripe actif n'existe encore (periode_debut est
  // null) — dans ce cas on retombe sur le 1er du mois calendaire, juste à titre informatif,
  // puisqu'aucune facture ne sera de toute façon générée avant la fin de l'essai.
  useEffect(() => {
    if (!abonnement) return;
    const chargerRevenuPubMois = async () => {
      try {
        const maintenant = new Date();
        const debut = abonnement.periode_debut
          ? abonnement.periode_debut.slice(0, 10)
          : `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}-01`;
        const fin = maintenant.toISOString().slice(0, 10);
        const res = await fetch(`/api/gestionnaires/addon-pub-sponsor/monetisation-periode?debut=${debut}&fin=${fin}`, {
          headers: { Authorization: `Bearer ${token()}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setRevenuPubMois({ clics: data.clics, revenu: data.revenu, montant_par_clic: data.montant_par_clic });
      } catch {
        // silencieux — si l'add-on pub n'est pas activé, ça ne doit pas bloquer la page
      }
    };
    chargerRevenuPubMois();
  }, [abonnement]);

  const configurerPaiement = async () => {
    setActionEnCours('paiement');
    try {
      const res = await fetch('/api/abonnements-studio/configurer-paiement', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setMessage({ type: 'error', texte: data.error || 'Erreur.' });
    } catch {
      setMessage({ type: 'error', texte: 'Erreur de connexion.' });
    }
    setActionEnCours(null);
  };

  const gererPortail = async () => {
    setActionEnCours('portail');
    try {
      const res = await fetch('/api/abonnements-studio/portail', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setMessage({ type: 'error', texte: data.error || 'Erreur.' });
    } catch {
      setMessage({ type: 'error', texte: 'Erreur de connexion.' });
    }
    setActionEnCours(null);
  };

  const annuler = async () => {
    if (!window.confirm('Confirmer l\'annulation ? Vous conserverez l\'accès jusqu\'à la fin de la période en cours.')) return;
    setActionEnCours('annuler');
    try {
      const res = await fetch('/api/abonnements-studio/annuler', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) { setMessage({ type: 'success', texte: data.message }); charger(); }
      else setMessage({ type: 'error', texte: data.error || 'Erreur.' });
    } catch {
      setMessage({ type: 'error', texte: 'Erreur de connexion.' });
    }
    setActionEnCours(null);
  };

  const toggleOption = async (option: OptionDispo) => {
    setActionEnCours(option.code);
    try {
      const res = await fetch(`/api/abonnements-studio/options/${option.code}${option.activee ? '' : '/activer'}`, {
        method: option.activee ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) { await charger(); setMessage({ type: 'success', texte: option.activee ? 'Option désactivée.' : 'Option activée !' }); }
      else setMessage({ type: 'error', texte: data.error || 'Erreur.' });
    } catch {
      setMessage({ type: 'error', texte: 'Erreur de connexion.' });
    }
    setActionEnCours(null);
  };

  const fmt = (n: number) => n.toFixed(2).replace('.', ',') + ' $';

  const chargerRevenuPubFacture = async (facture: FactureHistorique) => {
    if (!facture.periode_debut || !facture.periode_fin || revenuPubFacture[facture.id] !== undefined) return;
    try {
      const debut = facture.periode_debut.slice(0, 10);
      const fin = facture.periode_fin.slice(0, 10);
      const res = await fetch(`/api/gestionnaires/addon-pub-sponsor/monetisation-periode?debut=${debut}&fin=${fin}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setRevenuPubFacture(prev => ({ ...prev, [facture.id]: { clics: data.clics, revenu: data.revenu } }));
    } catch {
      // silencieux
    }
  };

  // Sélectionne automatiquement la facture la plus récente quand on arrive sur l'onglet
  useEffect(() => {
    if (vue === 'factures' && factures.length > 0 && factureSelectionnee === null) {
      setFactureSelectionnee(factures[0].id);
      chargerRevenuPubFacture(factures[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vue, factures]);

  const formatDate = (d: string | null) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Reflète le vrai cycle Stripe (periode_debut → periode_fin), pas un mois calendaire —
  // la facturation Studio est glissante, ancrée sur la date d'inscription du gestionnaire.
  const nomMoisEnCours = () => {
    if (abonnement?.periode_debut && abonnement?.periode_fin) {
      return `${formatDate(abonnement.periode_debut)} – ${formatDate(abonnement.periode_fin)}`;
    }
    return new Date().toLocaleDateString('fr-CA', { year: 'numeric', month: 'long' }) + ' (essai)';
  };

  const statutBadge = (statut: string) => {
    if (statut === 'essai')   return { label: '⏳ Période d\'essai', couleur: '#f59e0b', bg: '#fffbeb' };
    if (statut === 'actif')   return { label: '✅ Actif',             couleur: '#10b981', bg: '#ecfdf5' };
    if (statut === 'annule')  return { label: '🔕 Annulé',           couleur: '#888',    bg: '#f3f4f6' };
    if (statut === 'impaye')  return { label: '❌ Paiement en échec', couleur: '#dc2626', bg: '#fef2f2' };
    return { label: statut, couleur: '#888', bg: '#f3f4f6' };
  };

  const statutFactureBadge = (statut: string) => {
    if (statut === 'paye')   return { label: 'Payée',  couleur: '#10b981', bg: '#ecfdf5' };
    if (statut === 'echoue') return { label: 'Échouée', couleur: '#dc2626', bg: '#fef2f2' };
    return { label: statut, couleur: '#888', bg: '#f3f4f6' };
  };

  if (chargement) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#888', fontFamily: "'Inter', sans-serif" }}>
        Chargement de vos services...
      </div>
    );
  }

  if (!abonnement && lignes.length === 0) {
    return (
      <div style={{ maxWidth: 600, margin: '60px auto', padding: '0 24px', textAlign: 'center', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a' }}>Aucun service actif</h2>
        <p style={{ color: '#666', marginTop: 8 }}>Choisissez un template pour démarrer votre essai gratuit de 14 jours.</p>
      </div>
    );
  }

  const badge = abonnement ? statutBadge(abonnement?.statut) : { label: '✅ Add-ons actifs', couleur: '#4F46E5', bg: '#eef2ff' };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px', fontFamily: "'Inter', sans-serif" }}>

      {/* ── En-tête ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1a1a1a', margin: 0 }}>💼 Mes services</h1>
        <p style={{ fontSize: 14, color: '#666', marginTop: 4 }}>Détail de votre abonnement mensuel e-Vend Studio</p>
      </div>

      {/* ── Message ── */}
      {message && (
        <div style={{
          padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 13,
          background: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
          color: message.type === 'success' ? '#065f46' : '#991b1b',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          {message.texte}
          <button onClick={() => setMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'inherit' }}>✕</button>
        </div>
      )}

      {/* ── Bandeau essai ── */}
      {abonnement?.statut === 'essai' && (
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fff 100%)',
          border: '2px solid #f59e0b', borderRadius: 12, padding: '16px 20px', marginBottom: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#92400e' }}>
              ⏳ Période d'essai gratuite — {abonnement.jours_essai_restants !== null ? `${abonnement.jours_essai_restants} jour(s) restant(s)` : ''}
            </div>
            <div style={{ fontSize: 12, color: '#a16207', marginTop: 4 }}>
              Fin de l'essai : {formatDate(abonnement.essai_fin)}. Aucun paiement requis avant cette date.
            </div>
          </div>
          <button
            onClick={configurerPaiement}
            disabled={actionEnCours === 'paiement'}
            style={{ padding: '10px 20px', background: '#f59e0b', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          >
            {actionEnCours === 'paiement' ? '⏳...' : 'Configurer le paiement →'}
          </button>
        </div>
      )}

      {/* ── Bandeau impayé ── */}
      {abonnement?.statut === 'impaye' && (
        <div style={{ background: '#fef2f2', border: '2px solid #ef4444', borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontWeight: 700, color: '#991b1b' }}>❌ Paiement échoué — Mettez votre carte à jour pour rétablir l'accès.</div>
          <button onClick={gererPortail} disabled={actionEnCours === 'portail'} style={{ padding: '10px 20px', background: '#dc2626', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            {actionEnCours === 'portail' ? '⏳...' : 'Mettre à jour la carte →'}
          </button>
        </div>
      )}

      {/* ── Onglets ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#f3f4f6', borderRadius: 10, padding: 4 }}>
        {([['services', '📋 Mon abonnement'], ['options', '⚙️ Options disponibles'], ['factures', '🧾 Factures']] as [Vue, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setVue(id)} style={{
            flex: 1, padding: '9px 16px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: vue === id ? '#fff' : 'transparent',
            color: vue === id ? '#4F46E5' : '#888',
            boxShadow: vue === id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* ══════════ VUE ABONNEMENT ══════════ */}
      {vue === 'services' && (
        <>
          {/* Carte statut + infos */}
          <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Statut</div>
              <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700, background: badge.bg, color: badge.couleur }}>
                {badge.label}
              </span>
              {abonnement?.statut === 'actif' && abonnement?.periode_fin && (
                <div style={{ fontSize: 12, color: '#888', marginTop: 8 }}>Prochain renouvellement : {formatDate(abonnement?.periode_fin)}</div>
              )}
              {abonnement?.statut === 'annule' && abonnement?.periode_fin && (
                <div style={{ fontSize: 12, color: '#888', marginTop: 8 }}>Accès conservé jusqu'au : {formatDate(abonnement?.periode_fin)}</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {abonnement?.statut === 'actif' && (
                <>
                  <button onClick={gererPortail} disabled={!!actionEnCours} style={btnSecondaire}>
                    {actionEnCours === 'portail' ? '⏳...' : '💳 Gérer la carte'}
                  </button>
                  <button onClick={annuler} disabled={!!actionEnCours} style={{ ...btnSecondaire, color: '#dc2626', borderColor: '#fca5a5' }}>
                    {actionEnCours === 'annuler' ? '⏳...' : 'Annuler l\'abonnement'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tableau de décomposition */}
          <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ padding: '14px 20px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>
              Détail du mois en cours — {nomMoisEnCours()}
            </div>

            {lignes.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#888', fontSize: 13 }}>Aucun service configuré.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {lignes.map(ligne => (
                    <tr key={ligne.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{ligne.nom}</div>
                        <div style={{ fontSize: 11, color: '#aaa', marginTop: 2, textTransform: 'uppercase' }}>
                          {ligne.type === 'forfait' ? 'Forfait de base' : ligne.type === 'option' ? 'Option' : ligne.type === 'domaine_externe' ? 'Domaine externe' : 'Add-on'}
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 700, fontSize: 14, color: '#1a1a1a', whiteSpace: 'nowrap' }}>
                        {fmt(parseFloat(String(ligne.prix_ht)))} / mois
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Total */}
            {totaux && (() => {
              const revenuPub = revenuPubMois?.revenu || 0;
              const net = totaux.total - revenuPub;
              return (
                <div style={{ padding: '16px 20px', borderTop: '2px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ width: 320 }}>
                      <div style={ligneTotaux}><span style={{ color: '#666' }}>Sous-total</span><span>{fmt(totaux.montant_ht)}</span></div>
                      <div style={ligneTotaux}><span style={{ color: '#666' }}>TPS (5 %)</span><span>{fmt(totaux.tps)}</span></div>
                      <div style={ligneTotaux}><span style={{ color: '#666' }}>TVQ (9,975 %)</span><span>{fmt(totaux.tvq)}</span></div>
                      <div style={{ ...ligneTotaux, fontWeight: 700 }}><span style={{ color: '#666' }}>Total services / mois</span><span>{fmt(totaux.total)}</span></div>

                      {revenuPubMois && (
                        <>
                          <div style={{ borderTop: '1px dashed #e5e7eb', margin: '10px 0 6px' }} />
                          <div style={ligneTotaux}>
                            <span style={{ color: '#666' }}>
                              💰 Revenus publicitaires ({revenuPubMois.clics} clic{revenuPubMois.clics > 1 ? 's' : ''})
                            </span>
                            <span style={{ color: '#16a34a' }}>− {fmt(revenuPub)}</span>
                          </div>
                        </>
                      )}

                      <div style={{
                        ...ligneTotaux,
                        background: net >= 0 ? '#4F46E5' : '#16a34a', color: '#fff',
                        padding: '10px 14px', borderRadius: 8, marginTop: 8, fontWeight: 800, fontSize: 16,
                      }}>
                        <span>{net >= 0 ? 'Net à payer / mois' : 'e-Vend Studio vous doit'}</span>
                        <span>{fmt(Math.abs(net))}</span>
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 11, color: '#aaa', textAlign: 'right', marginTop: 10 }}>
                    Facturé en dollars canadiens (CAD), taxes comprises.<br />
                    {abonnement?.statut === 'actif' && abonnement?.periode_fin ? `Prochain paiement le ${formatDate(abonnement?.periode_fin)}.` : ''}
                  </p>
                </div>
              );
            })()}
          </div>
        </>
      )}

      {/* ══════════ VUE OPTIONS ══════════ */}
      {vue === 'options' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {options.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Aucune option disponible pour le moment.</div>
          ) : options.map(opt => (
            <div key={opt.code} style={{
              background: '#fff', border: `1.5px solid ${opt.activee ? '#4F46E5' : '#e5e7eb'}`,
              borderRadius: 12, padding: '16px 20px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{opt.nom}</span>
                  {opt.activee && (
                    <span style={{ fontSize: 10, fontWeight: 700, background: '#eef2ff', color: '#4F46E5', padding: '2px 8px', borderRadius: 10 }}>ACTIVÉ</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>{opt.description}</div>
                <div style={{ fontSize: 12, color: '#888' }}>
                  {fmt(opt.prix_ht)} / mois avant taxes
                  <span style={{ margin: '0 6px', color: '#ddd' }}>·</span>
                  {fmt(opt.taxes.total)} / mois taxes incluses
                </div>
              </div>
              <button
                onClick={() => toggleOption(opt)}
                disabled={actionEnCours === opt.code}
                style={{
                  padding: '9px 18px', border: 'none', borderRadius: 8,
                  fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                  background: opt.activee ? '#fef2f2' : '#4F46E5',
                  color: opt.activee ? '#dc2626' : '#fff',
                }}
              >
                {actionEnCours === opt.code ? '⏳...' : opt.activee ? 'Désactiver' : 'Activer'}
              </button>
            </div>
          ))}

          <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 8 }}>
            Les options activées s'ajoutent à votre montant mensuel dès le prochain cycle de facturation.
          </p>
        </div>
      )}
      {/* ══════════ VUE FACTURES (HISTORIQUE) ══════════ */}
      {vue === 'factures' && (
        factures.length === 0 ? (
          <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, padding: 40, textAlign: 'center', color: '#888', fontSize: 13 }}>
            Aucune facture pour le moment. Vos factures apparaîtront ici après votre premier paiement.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Gauche : liste des mois */}
            <div style={{ flex: '0 0 260px', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>
                Historique
              </div>
              <div style={{ maxHeight: 520, overflowY: 'auto' }}>
                {factures.map(f => {
                  const fBadge = statutFactureBadge(f.statut);
                  const selectionnee = factureSelectionnee === f.id;
                  return (
                    <div
                      key={f.id}
                      onClick={() => { setFactureSelectionnee(f.id); chargerRevenuPubFacture(f); }}
                      style={{
                        padding: '12px 18px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6',
                        background: selectionnee ? '#eef2ff' : 'transparent',
                        borderLeft: selectionnee ? '3px solid #4F46E5' : '3px solid transparent',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: selectionnee ? '#4F46E5' : '#1a1a1a' }}>
                        {f.periode_debut ? formatDate(f.periode_debut).replace(/^\d+ /, '') : formatDate(f.created_at)}
                      </div>
                      <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{f.numero_facture || 'En traitement'}</div>
                      <span style={{ display: 'inline-block', marginTop: 4, padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: fBadge.bg, color: fBadge.couleur }}>
                        {fBadge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Droite : détail du mois sélectionné */}
            <div style={{ flex: '1 1 400px', minWidth: 300 }}>
              {(() => {
                const f = factures.find(x => x.id === factureSelectionnee);
                if (!f) return (
                  <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, padding: 40, textAlign: 'center', color: '#888' }}>
                    Sélectionnez un mois à gauche pour voir le détail.
                  </div>
                );
                const fBadge = statutFactureBadge(f.statut);
                const revenuPub = revenuPubFacture[f.id];
                const montantTotal = f.montant_total !== null ? parseFloat(String(f.montant_total)) : 0;
                const net = revenuPub ? montantTotal - revenuPub.revenu : null;

                return (
                  <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a' }}>{f.numero_facture || 'Facture en traitement'}</div>
                        <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                          {f.periode_debut && f.periode_fin ? `Période : ${formatDate(f.periode_debut)} — ${formatDate(f.periode_fin)}` : formatDate(f.created_at)}
                        </div>
                      </div>
                      <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: fBadge.bg, color: fBadge.couleur }}>
                        {fBadge.label}
                      </span>
                    </div>

                    <div style={{ padding: '16px 20px' }}>
                      <div style={ligneTotaux}><span style={{ color: '#666' }}>Montant des services (facturé)</span><span>{f.montant_total !== null ? fmt(montantTotal) : '—'}</span></div>

                      {revenuPub ? (
                        <div style={ligneTotaux}>
                          <span style={{ color: '#666' }}>💰 Revenus publicitaires ({revenuPub.clics} clic{revenuPub.clics > 1 ? 's' : ''})</span>
                          <span style={{ color: '#16a34a' }}>− {fmt(revenuPub.revenu)}</span>
                        </div>
                      ) : f.periode_debut && f.periode_fin ? (
                        <div style={{ fontSize: 12, color: '#aaa', padding: '6px 0' }}>⏳ Chargement des revenus pub...</div>
                      ) : null}

                      {net !== null && (
                        <div style={{
                          ...ligneTotaux,
                          background: net >= 0 ? '#4F46E5' : '#16a34a', color: '#fff',
                          padding: '10px 14px', borderRadius: 8, marginTop: 10, fontWeight: 800, fontSize: 15,
                        }}>
                          <span>{net >= 0 ? 'Net payé ce mois-là' : 'e-Vend Studio vous devait'}</span>
                          <span>{fmt(Math.abs(net))}</span>
                        </div>
                      )}

                      {f.statut === 'paye' && f.numero_facture && (
                        <button
                          onClick={() => setFactureOuverte(f.id)}
                          style={{ marginTop: 16, width: '100%', padding: '10px 0', border: '1.5px solid #e5e7eb', background: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#4F46E5' }}
                        >
                          🖨️ Voir la facture officielle
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )
      )}

      {/* ── Popup facture (ouvrable depuis n'importe quel onglet) ── */}
      {factureOuverte !== null && (
        <FacturePopupAbonnement factureId={factureOuverte} onClose={() => setFactureOuverte(null)} />
      )}
    </div>
  );
}

const btnSecondaire: React.CSSProperties = {
  padding: '8px 16px', background: '#fff', border: '1.5px solid #e5e7eb',
  borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#444',
};

const ligneTotaux: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', padding: '5px 0',
  fontSize: 13, color: '#1a1a1a',
};