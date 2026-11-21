// CHEMIN : src/pages/boutique/CaisseBoutique.tsx
// e-Vend Studio — Caisse de l'acheteur, commune à tous les templates boutique (solo). Distincte de la caisse du multivendeur.
// Présentation reprise de la caisse Studio (sections numérotées, barre de progression, récapitulatif), dans le style du panier boutique.
// Le navigateur n'envoie que les adresses, le mode d'expédition, le mode de paiement et le pourboire : le serveur recalcule prix, expédition, taxes et total.
// Le paiement se fait sur la page Stripe / PayPal DU GESTIONNAIRE (son propre compte). Un mode n'est offert que s'il est configuré par le gestionnaire.
// API : /api/boutique/acheteur/<gestionnaire>/ caisse/infos, caisse/commande, adresses, profil

import React, { useCallback, useEffect, useState } from 'react';
import { ba, messageAcheteur, argent } from './boutiqueAcheteurApi';
import ResumePerso, { PersoCliche } from '../../components/ResumePerso';   // add-on « Produits personnalisés »
import FormulaireAdresseBoutique, { AdresseCarnet, AdresseSaisie, adresseVide, ligneAdresse } from './FormulaireAdresseBoutique';

interface Ligne { id: number; titre: string; variante: string; quantite: number; prix: number; total_ligne: number; image_url: string | null; personnalisation?: PersoCliche | null; }
interface Infos {
  lignes: Ligne[]; sous_total: number; devise: string;
  methodes_expedition: { id: number; nom?: string; transporteur_nom?: string; logo?: string; frais_calcule?: number; delais_estime?: string; detail_calcul?: string }[];
  expedition_indisponible: boolean; modes_paiement: { stripe: boolean; paypal: boolean }; problemes: string[];
  pourboire?: { actif: boolean; pourcentages: number[]; message: string | null; max: number };
  code_promo?: { code: string; rabais: number }; code_erreur?: string;
  totaux?: { sous_total: number; rabais?: number; frais_expedition: number; taxes: { total_taxes: number; tps: number; tvq: number; tvh: number; tvp: number; label: string }; pourboire: number; total: number };
  totaux_erreur?: string;
}
// Adresse retenue : du carnet (id) ou saisie à la caisse sans être enregistrée (id = null)
interface Choix { id: number | null; adr: AdresseSaisie; }
interface Props { gestionnaireId: number; accent?: string; naviguerVers: (page: string) => void; }

const CSS = `
  @keyframes cbqSpin { to { transform: rotate(360deg); } }
  @keyframes cbqFade { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  .cbq-section { animation: cbqFade 0.3s ease; }
  .cbq-carte { transition: all 0.18s ease; cursor: pointer; }
  .cbq-carte:hover { background: #fef9ee !important; border-color: var(--cbq-c) !important; }
  .cbq-tip { transition: all 0.18s ease; }
  .cbq-tip:hover { border-color: var(--cbq-c) !important; color: var(--cbq-c) !important; }
  .cbq-payer:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,0,0,0.25) !important; }
  .cbq-lien:hover { text-decoration: underline; }
`;

const delaiPaiement = { stripe: 'Vous serez redirigé vers la page de paiement sécurisée Stripe de la boutique.', paypal: 'Vous serez redirigé vers PayPal pour finaliser votre achat auprès de la boutique.' };
const ETAPES = ['Livraison', 'Paiement', 'Confirmation'];

const versAdresse = (c: AdresseCarnet): AdresseSaisie => ({ libelle: c.libelle, nom: c.nom, adresse1: c.adresse1, adresse2: c.adresse2, ville: c.ville, province: c.province, code_postal: c.code_postal, pays: c.pays, telephone: c.telephone, type: c.type, est_principale: c.est_principale });
const pourEnvoi = (a: AdresseSaisie) => ({ nom: a.nom, adresse1: a.adresse1, adresse2: a.adresse2, ville: a.ville, province: a.province, code_postal: a.code_postal, pays: a.pays, telephone: a.telephone });

function Radio({ actif, c }: { actif: boolean; c: string }) {
  return (
    <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, border: `2px solid ${actif ? c : '#d6c3a0'}`, background: actif ? c : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
      {actif && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
    </div>
  );
}

export default function CaisseBoutique({ gestionnaireId: gid, accent, naviguerVers }: Props) {
  const c = accent || '#b47828';
  const degrade = `linear-gradient(135deg, ${c}, ${c}cc)`;
  const [larg, setLarg] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [zone, setZone] = useState<HTMLDivElement | null>(null);
  const mobile = larg < 700;
  const deuxColonnes = larg >= 960;

  const [carnet, setCarnet] = useState<AdresseCarnet[] | null>(null);
  const [nomProfil, setNomProfil] = useState({ nom: '', telephone: '' });
  const [livSel, setLivSel] = useState<Choix | null>(null);
  const [formLiv, setFormLiv] = useState(false);
  const [memeFact, setMemeFact] = useState(true);
  const [factSel, setFactSel] = useState<Choix | null>(null);
  const [formFact, setFormFact] = useState(false);
  const [enregAdresse, setEnregAdresse] = useState(false);
  const [erreurAdresse, setErreurAdresse] = useState('');
  const [methodeId, setMethodeId] = useState<string>('');
  const [mode, setMode] = useState<'stripe' | 'paypal' | ''>('');
  const [note, setNote] = useState('');
  // Add-on « Infolettre » : case facultative (jamais cochée d'avance) ; l'adresse inscrite est celle du compte, choisie côté serveur
  const [infoCaisse, setInfoCaisse] = useState<{ texte: string } | null>(null);
  const [infoCoche, setInfoCoche] = useState(false);
  useEffect(() => {
    let vivant = true;
    fetch(`/api/boutique/infolettre/${gid}/config`).then(r => (r.ok ? r.json() : null)).then(c => { if (vivant && c && c.afficher_caisse) setInfoCaisse({ texte: c.texte_caisse }); }).catch(() => {});
    return () => { vivant = false; };
  }, [gid]);
  const [infos, setInfos] = useState<Infos | null>(null);
  const [codeSaisi, setCodeSaisi] = useState('');
  const [codeApplique, setCodeApplique] = useState('');
  const [tipPct, setTipPct] = useState<number | null>(null);   // pourcentage proposé choisi
  const [tipTxt, setTipTxt] = useState('');                    // montant libre
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    const f = () => setLarg(zone ? zone.clientWidth : window.innerWidth);
    f();
    window.addEventListener('resize', f);
    let ro: any = null;
    if (zone && typeof (window as any).ResizeObserver !== 'undefined') { ro = new (window as any).ResizeObserver(f); ro.observe(zone); }
    return () => { window.removeEventListener('resize', f); if (ro) ro.disconnect(); };
  }, [zone]);

  // Carnet d'adresses + nom du compte (pré-remplit le formulaire)
  useEffect(() => {
    let annule = false;
    Promise.all([ba(gid, '/adresses'), ba(gid, '/profil')]).then(([a, p]) => {
      if (annule) return;
      const liste: AdresseCarnet[] = a.ok ? a.data.adresses : [];
      setCarnet(liste);
      if (p.ok) setNomProfil({ nom: [p.data.profil.prenom, p.data.profil.nom].filter(Boolean).join(' '), telephone: p.data.profil.telephone || '' });
      const livs = liste.filter(x => x.type === 'livraison');
      const princ = livs.find(x => x.est_principale) || livs[0];
      if (princ) setLivSel({ id: princ.id, adr: versAdresse(princ) }); else setFormLiv(true);
    });
    return () => { annule = true; };
  }, [gid]);

  const province = livSel ? livSel.adr.province : 'QC';
  const charger = useCallback(async (prov: string, methode: string, code: string) => {
    const r = await ba(gid, '/caisse/infos', { method: 'POST', body: { province: prov, methode_id: methode || undefined, code_promo: code || undefined } });
    if (r.status === 401) { setErreur('Connectez-vous pour passer à la caisse.'); return; }
    if (!r.ok) { setErreur(messageAcheteur(r)); return; }
    const d = r.data as Infos;
    setInfos(d);
    setMode(m => (m && (d.modes_paiement as any)[m]) ? m : (d.modes_paiement.stripe && !d.modes_paiement.paypal ? 'stripe' : d.modes_paiement.paypal && !d.modes_paiement.stripe ? 'paypal' : ''));
    setMethodeId(cur => (cur && d.methodes_expedition.some(x => String(x.id) === cur)) ? cur : (d.methodes_expedition.length === 1 ? String(d.methodes_expedition[0].id) : ''));
  }, [gid]);

  useEffect(() => { charger(province, methodeId, codeApplique); }, [province, methodeId, codeApplique, charger]);

  const livraisons = (carnet || []).filter(x => x.type === 'livraison');
  const facturations = (carnet || []).filter(x => x.type === 'facturation');

  // Valide une adresse saisie : l'enregistre dans le carnet si demandé, puis la retient
  const valider = async (a: AdresseSaisie, enregistrer: boolean, type: 'livraison' | 'facturation') => {
    setErreurAdresse('');
    let choix: Choix = { id: null, adr: { ...a, type } };
    if (enregistrer) {
      setEnregAdresse(true);
      const r = await ba(gid, '/adresses', { method: 'POST', body: { ...a, type } });
      setEnregAdresse(false);
      if (!r.ok) { setErreurAdresse(messageAcheteur(r)); return; }
      const nouvelle = r.data.adresse as AdresseCarnet;
      setCarnet(l => [...(l || []), nouvelle]);
      choix = { id: nouvelle.id, adr: versAdresse(nouvelle) };
    }
    if (type === 'livraison') { setLivSel(choix); setFormLiv(false); } else { setFactSel(choix); setFormFact(false); }
  };

  if (!infos || carnet === null) return (
    <div ref={setZone} style={{ ['--cbq-c' as any]: c, maxWidth: 1280, margin: '0 auto', padding: '16px 12px 60px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1c1917', minHeight: '60vh' }}>
      <style>{CSS}</style>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: 14 }}>
        {erreur ? <p style={{ color: '#b91c1c', fontSize: 15 }}>{erreur}</p> : (
          <><div style={{ width: 40, height: 40, border: '3px solid #f0e6d3', borderTop: `3px solid ${c}`, borderRadius: '50%', animation: 'cbqSpin 0.8s linear infinite' }} />
            <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Chargement du paiement…</p></>
        )}
      </div>
    </div>
  );

  const racine: React.CSSProperties = { ['--cbq-c' as any]: c, maxWidth: 1280, margin: '0 auto', padding: '16px 12px 60px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1c1917', minHeight: '60vh' };
  const carte: React.CSSProperties = { background: '#fffdf7', border: '1px solid #e7d5b8', borderRadius: 18, boxShadow: '0 2px 12px rgba(212,168,83,0.08)' };
  const dev = infos.devise;

  if (infos.lignes.length === 0) return (
    <div ref={setZone} style={racine}><style>{CSS}</style>
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#78716c' }}>
        <div style={{ fontSize: 44 }}>🛒</div><p style={{ margin: '10px 0 18px', fontSize: 16 }}>Votre panier est vide.</p>
        <button onClick={() => naviguerVers('boutique')} style={{ background: degrade, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 26px', fontWeight: 700, cursor: 'pointer' }}>Continuer mes achats</button>
      </div>
    </div>
  );

  const aucunPaiement = !infos.modes_paiement.stripe && !infos.modes_paiement.paypal;
  if (aucunPaiement) return (
    <div ref={setZone} style={racine}><style>{CSS}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 8px' }}>
        <div style={{ ...carte, borderColor: '#fecaca', padding: mobile ? '32px 20px' : '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#fef2f2', border: '2px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 20px' }}>🔒</div>
          <h2 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 12px' }}>Paiement temporairement indisponible</h2>
          <p style={{ fontSize: 14, color: '#78716c', lineHeight: 1.7, margin: '0 0 8px' }}>Cette boutique ne peut pas recevoir de paiements en ligne pour le moment.</p>
          <p style={{ fontSize: 13, color: '#a8926a', lineHeight: 1.6, margin: '0 0 28px' }}>Vous pouvez contacter la boutique par la messagerie ou réessayer plus tard. Vos articles restent dans votre panier.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => naviguerVers('messagerie')} style={{ padding: 14, background: degrade, color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>💬 Contacter la boutique</button>
            <button onClick={() => naviguerVers('panier')} style={{ padding: 14, background: 'transparent', color: '#92400e', border: '1px solid #e7d5b8', borderRadius: 12, fontSize: 14, cursor: 'pointer' }}>← Retour au panier</button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Totaux ────────────────────────────────────────────────────────────────
  const t = livSel ? infos.totaux : undefined;                      // pas de total tant que la livraison n'est pas connue
  const pb = infos.pourboire && infos.pourboire.actif ? infos.pourboire : null;
  const baseTip = t ? t.sous_total - (t.rabais || 0) : infos.sous_total;
  const txtNum = parseFloat(tipTxt.replace(',', '.'));
  const montantTip = !pb ? 0 : tipPct !== null ? Math.round(baseTip * tipPct) / 100 : (Number.isFinite(txtNum) && txtNum > 0 ? Math.round(txtNum * 100) / 100 : 0);
  const tipTrop = !!pb && montantTip > pb.max;
  const tipInvalide = !!pb && tipPct === null && tipTxt.trim() !== '' && !(Number.isFinite(txtNum) && txtNum >= 0);
  const totalAffiche = t ? t.total + montantTip : null;
  const choixExp = infos.methodes_expedition.find(m => String(m.id) === methodeId);
  const expOk = infos.methodes_expedition.length <= 1 || !!methodeId;
  const livOk = !!livSel && !infos.expedition_indisponible && expOk;
  const factOk = memeFact || !!factSel;
  const pret = !envoi && livOk && factOk && !!mode && !infos.problemes.length && !!t && !tipTrop && !tipInvalide;
  const etapeActive = !livOk || !factOk ? 0 : !mode ? 1 : 2;

  const payer = async () => {
    setErreur('');
    if (!livSel || !mode) return;
    setEnvoi(true);
    const corps: any = { methode_id: methodeId || undefined, mode, note, code_promo: codeApplique || undefined, pourboire: montantTip > 0 ? montantTip : undefined };
    if (infoCaisse && infoCoche) corps.infolettre = true;
    if (livSel.id !== null) corps.adresse_id = livSel.id; else corps.adresse = pourEnvoi(livSel.adr);
    if (!memeFact && factSel) { if (factSel.id !== null) corps.facturation_id = factSel.id; else corps.facturation = pourEnvoi(factSel.adr); }
    const r = await ba(gid, '/caisse/commande', { method: 'POST', body: corps });
    if (!r.ok) { setErreur(messageAcheteur(r)); setEnvoi(false); charger(province, methodeId, codeApplique); return; }
    window.location.href = r.data.checkout_url;   // page de paiement du gestionnaire (Stripe ou PayPal)
  };

  // ── Petits blocs ──────────────────────────────────────────────────────────
  const Section = (p: { n: number; icone: string; titre: string; children: React.ReactNode }) => (
    <div className="cbq-section" style={{ ...carte, overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: mobile ? '14px 14px' : '16px 22px', background: 'linear-gradient(to right, #fef9ee, #fef3c7)', borderBottom: '1px solid #f0e6d3' }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: degrade, color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{p.n}</div>
        <span style={{ fontSize: 18 }}>{p.icone}</span>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{p.titre}</h2>
      </div>
      <div style={{ padding: mobile ? 14 : 22 }}>{p.children}</div>
    </div>
  );

  const CarteAdresse = (p: { a: Choix; actif: boolean; onClick: () => void; badge?: string }) => (
    <div className="cbq-carte" onClick={p.onClick} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', border: `1px solid ${p.actif ? c : '#e7d5b8'}`, background: p.actif ? '#fef9ee' : '#fff', borderRadius: 12, marginBottom: 10 }}>
      <div style={{ marginTop: 2 }}><Radio actif={p.actif} c={c} /></div>
      <div style={{ minWidth: 0, fontSize: 13, lineHeight: 1.6 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{p.a.adr.nom}{p.a.adr.libelle ? <span style={{ color: '#a8926a', fontWeight: 600 }}> · {p.a.adr.libelle}</span> : null}</div>
        <div style={{ color: '#57534e' }}>{ligneAdresse(p.a.adr)}</div>
        {p.a.adr.telephone && <div style={{ color: '#a8926a', fontSize: 12 }}>📞 {p.a.adr.telephone}</div>}
        {p.badge && <span style={{ display: 'inline-block', marginTop: 4, fontSize: 11, fontWeight: 700, color: c, background: '#fef3c7', padding: '2px 8px', borderRadius: 20 }}>{p.badge}</span>}
        {p.a.id === null && <span style={{ display: 'inline-block', marginTop: 4, marginLeft: p.badge ? 6 : 0, fontSize: 11, color: '#78716c', background: '#f5f5f4', padding: '2px 8px', borderRadius: 20 }}>Non enregistrée</span>}
      </div>
    </div>
  );

  const lienBtn: React.CSSProperties = { background: 'none', border: 'none', padding: 0, color: c, fontSize: 13, fontWeight: 700, cursor: 'pointer' };
  const ligneRecap = (nom: string, v: string, o?: { vert?: boolean; gris?: boolean; note?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
      <div><span style={{ fontSize: 13, color: o && o.gris ? '#a8926a' : '#78716c' }}>{nom}</span>{o && o.note && <div style={{ fontSize: 11, color: '#a8926a' }}>{o.note}</div>}</div>
      <span style={{ fontSize: 13, fontWeight: 500, color: o && o.vert ? '#16a34a' : '#1c1917', textAlign: 'right' }}>{v}</span>
    </div>
  );

  const selLiv = livSel ? livraisons.some(x => x.id === livSel.id) : false;
  const nomPrefill = nomProfil.nom, telPrefill = nomProfil.telephone;

  // ── Colonne gauche ────────────────────────────────────────────────────────
  const colGauche = (
    <div style={{ minWidth: 0 }}>
      {erreur && <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 14 }}>⚠️ {erreur}</div>}
      {infos.problemes.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 14 }}>
          {infos.problemes.map((p, i) => <div key={i}>⚠️ {p}</div>)}
          <button className="cbq-lien" onClick={() => naviguerVers('panier')} style={{ ...lienBtn, marginTop: 8, color: '#92400e', textDecoration: 'underline' }}>Retourner au panier</button>
        </div>
      )}

      {Section({ n: 1, icone: '📦', titre: 'Articles commandés', children: (
        <div>
          {infos.lignes.map((l, i) => (
            <div key={l.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: i < infos.lignes.length - 1 ? '1px solid #f0e6d3' : 'none' }}>
              <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
                {l.image_url ? <img src={l.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                  : <div style={{ width: '100%', height: '100%', background: '#f5ecd9', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📦</div>}
                <div style={{ position: 'absolute', top: -6, right: -6, minWidth: 20, height: 20, borderRadius: 10, background: c, color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>{l.quantite}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{l.titre}</div>
                {l.variante && <div style={{ fontSize: 12, color: '#a8926a' }}>{l.variante}</div>}
                <ResumePerso perso={l.personnalisation} compact />
                <div style={{ fontSize: 12, color: '#a8926a' }}>{argent(l.prix, dev)} / unité</div>
              </div>
              <strong style={{ fontSize: 14 }}>{argent(l.total_ligne, dev)}</strong>
            </div>
          ))}
        </div>
      ) })}

      {Section({ n: 2, icone: '📍', titre: 'Adresse de livraison', children: (
        !formLiv && (livraisons.length > 0 || livSel) ? (
          <div>
            {livraisons.map(a => <CarteAdresse key={a.id} a={{ id: a.id, adr: versAdresse(a) }} actif={!!livSel && livSel.id === a.id} badge={a.est_principale ? 'Adresse principale' : undefined} onClick={() => setLivSel({ id: a.id, adr: versAdresse(a) })} />)}
            {livSel && !selLiv && <CarteAdresse a={livSel} actif onClick={() => undefined} />}
            <button className="cbq-lien" style={lienBtn} onClick={() => { setErreurAdresse(''); setFormLiv(true); }}>+ Utiliser une autre adresse</button>
          </div>
        ) : (
          <FormulaireAdresseBoutique key="liv" initiale={adresseVide('livraison', nomPrefill, telPrefill)} accent={c} titreBouton="Utiliser cette adresse" afficherEnregistrer enregistrerParDefaut enCours={enregAdresse} erreur={erreurAdresse}
            onValider={(a, e) => valider(a, e, 'livraison')} onAnnuler={livraisons.length > 0 || livSel ? () => setFormLiv(false) : undefined} />
        )
      ) })}

      {Section({ n: 3, icone: '📄', titre: 'Adresse de facturation', children: (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: memeFact ? 0 : 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }} onClick={() => setMemeFact(true)}><Radio actif={memeFact} c={c} /> Identique à l'adresse de livraison</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }} onClick={() => { setMemeFact(false); if (!factSel && facturations.length === 0) setFormFact(true); }}><Radio actif={!memeFact} c={c} /> Utiliser une adresse de facturation différente</label>
          </div>
          {!memeFact && (!formFact && (facturations.length > 0 || factSel) ? (
            <div>
              {facturations.map(a => <CarteAdresse key={a.id} a={{ id: a.id, adr: versAdresse(a) }} actif={!!factSel && factSel.id === a.id} badge={a.est_principale ? 'Adresse principale' : undefined} onClick={() => setFactSel({ id: a.id, adr: versAdresse(a) })} />)}
              {factSel && factSel.id === null && <CarteAdresse a={factSel} actif onClick={() => undefined} />}
              <button className="cbq-lien" style={lienBtn} onClick={() => { setErreurAdresse(''); setFormFact(true); }}>+ Autre adresse de facturation</button>
            </div>
          ) : (
            <FormulaireAdresseBoutique key="fact" initiale={adresseVide('facturation', nomPrefill, telPrefill)} accent={c} titreBouton="Utiliser cette adresse" afficherEnregistrer enregistrerParDefaut enCours={enregAdresse} erreur={erreurAdresse}
              onValider={(a, e) => valider(a, e, 'facturation')} onAnnuler={facturations.length > 0 || factSel ? () => setFormFact(false) : (() => setMemeFact(true))} />
          ))}
        </div>
      ) })}

      {Section({ n: 4, icone: '🚚', titre: "Mode d'expédition", children: (
        !livSel ? <div style={{ fontSize: 13, color: '#78716c' }}>ℹ️ Choisissez d'abord une adresse de livraison.</div>
          : infos.expedition_indisponible ? <div style={{ color: '#b91c1c', fontSize: 14 }}>Cette boutique ne livre pas dans cette province ({livSel.adr.province}). Choisissez une autre adresse de livraison.</div>
          : (
            <div>
              <div style={{ fontSize: 13, color: '#78716c', marginBottom: 10 }}>📍 Livraison à <strong style={{ color: '#1c1917' }}>{livSel.adr.ville}, {livSel.adr.province}</strong></div>
              {infos.methodes_expedition.map(m => {
                const nom = m.nom || m.transporteur_nom || 'Livraison';
                const frais = Number(m.frais_calcule || 0);
                const actif = String(m.id) === methodeId;
                return (
                  <div key={m.id} className="cbq-carte" onClick={() => setMethodeId(String(m.id))} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', border: `1px solid ${actif ? c : '#e7d5b8'}`, background: actif ? '#fef9ee' : '#fff', borderRadius: 12, marginBottom: 10 }}>
                    <Radio actif={actif} c={c} />
                    {m.logo ? <span style={{ fontSize: 22 }}>{m.logo}</span> : null}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{nom}</div>
                      {m.delais_estime && <div style={{ fontSize: 12, color: '#a8926a' }}>⏱ {m.delais_estime}</div>}
                      {m.detail_calcul && frais > 0 && <div style={{ fontSize: 11, color: '#a8926a', fontStyle: 'italic' }}>{m.detail_calcul}</div>}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: frais === 0 ? '#16a34a' : c, background: frais === 0 ? '#dcfce7' : '#fef3c7', padding: '3px 10px', borderRadius: 20, flexShrink: 0 }}>{frais === 0 ? 'Gratuit' : argent(frais, dev)}</span>
                  </div>
                );
              })}
            </div>
          )
      ) })}

      {Section({ n: 5, icone: '💳', titre: 'Mode de paiement', children: (
        <div>
          {infos.modes_paiement.stripe && (
            <>
              <div className="cbq-carte" onClick={() => setMode('stripe')} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', border: `1px solid ${mode === 'stripe' ? c : '#e7d5b8'}`, background: mode === 'stripe' ? '#fef9ee' : '#fff', borderRadius: 12, marginBottom: 10 }}>
                <Radio actif={mode === 'stripe'} c={c} />
                <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700 }}>Carte de crédit ou de débit</div><div style={{ fontSize: 12, color: '#a8926a' }}>Visa, Mastercard, Amex — paiement sécurisé</div></div>
                <span style={{ fontSize: 22 }}>💳</span>
              </div>
              {mode === 'stripe' && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 10 }}>🔒 {delaiPaiement.stripe}</div>}
            </>
          )}
          {infos.modes_paiement.paypal && (
            <>
              <div className="cbq-carte" onClick={() => setMode('paypal')} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', border: `1px solid ${mode === 'paypal' ? c : '#e7d5b8'}`, background: mode === 'paypal' ? '#fef9ee' : '#fff', borderRadius: 12, marginBottom: 10 }}>
                <Radio actif={mode === 'paypal'} c={c} />
                <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700 }}>PayPal</div><div style={{ fontSize: 12, color: '#a8926a' }}>Compte PayPal ou carte via PayPal</div></div>
                <span style={{ fontSize: 22 }}>🅿️</span>
              </div>
              {mode === 'paypal' && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 10 }}>🅿️ {delaiPaiement.paypal}</div>}
            </>
          )}
        </div>
      ) })}

      {pb && Section({ n: 6, icone: '🎁', titre: 'Pourboire (facultatif)', children: (
        <div>
          <p style={{ fontSize: 13, color: '#78716c', margin: '0 0 14px', lineHeight: 1.6 }}>{pb.message || 'Un petit mot de remerciement pour la boutique. Le pourboire est facultatif et n’est pas taxé.'}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {[null, ...pb.pourcentages].map(pct => {
              const actif = pct === null ? tipPct === null && tipTxt.trim() === '' : tipPct === pct;
              const montant = pct === null ? 0 : Math.round(baseTip * pct) / 100;
              return (
                <button key={pct === null ? 'aucun' : pct} className="cbq-tip" onClick={() => { setTipPct(pct); setTipTxt(''); }}
                  style={{ padding: '9px 14px', borderRadius: 10, border: `1px solid ${actif ? c : '#e7d5b8'}`, background: actif ? '#fef3c7' : '#fff', color: actif ? c : '#57534e', fontWeight: actif ? 800 : 600, fontSize: 13, cursor: 'pointer' }}>
                  {pct === null ? 'Aucun' : `${pct} % (${argent(montant, dev)})`}
                </button>
              );
            })}
            <input value={tipTxt} placeholder="Autre $" inputMode="decimal" onChange={e => { setTipTxt(e.target.value); setTipPct(null); }}
              style={{ width: 96, padding: '9px 12px', borderRadius: 10, border: `1px solid ${tipTxt.trim() !== '' ? c : '#e7d5b8'}`, fontSize: 13, outline: 'none', background: '#fff' }} />
          </div>
          {(tipTrop || tipInvalide) && <div style={{ color: '#b91c1c', fontSize: 12, marginTop: 8 }}>{tipTrop ? `Le pourboire maximum est de ${argent(pb.max, dev)}.` : 'Montant de pourboire invalide.'}</div>}
        </div>
      ) })}

      {Section({ n: pb ? 7 : 6, icone: '📝', titre: 'Note pour la boutique (facultatif)', children: (
        <>
        <textarea value={note} maxLength={500} onChange={e => setNote(e.target.value)} placeholder="Instructions de livraison, message…" style={{ width: '100%', boxSizing: 'border-box', minHeight: 70, padding: '10px 12px', border: '1px solid #e7d5b8', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', background: '#fff', outline: 'none', resize: 'vertical' }} />
          {infoCaisse && (
            <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 12, fontSize: 13, color: '#78716c', cursor: 'pointer', lineHeight: 1.5 }}>
              <input type="checkbox" checked={infoCoche} onChange={e => setInfoCoche(e.target.checked)} style={{ marginTop: 3, accentColor: c, flexShrink: 0 }} />
              <span>{infoCaisse.texte}</span>
            </label>
          )}
        </>
      ) })}
    </div>
  );

  // ── Récapitulatif ─────────────────────────────────────────────────────────
  const libelleBouton = envoi ? 'Redirection…'
    : !livSel ? '📍 Adresse requise'
    : infos.expedition_indisponible ? '🚚 Livraison impossible ici'
    : !expOk ? "🚚 Choisir un mode d'expédition"
    : !factOk ? '📄 Adresse de facturation requise'
    : !mode ? '💳 Choisir un mode de paiement'
    : infos.problemes.length ? '⚠️ Corrigez votre panier'
    : `${mode === 'stripe' ? '💳' : '🅿️'} Payer ${totalAffiche !== null ? argent(totalAffiche, dev) : ''}`;

  const recap = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: deuxColonnes ? 'sticky' : 'relative', top: deuxColonnes ? 20 : 'auto', minWidth: 0 }}>
      <div style={{ ...carte, padding: mobile ? 14 : 22, boxShadow: '0 4px 20px rgba(212,168,83,0.1)' }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 16px', paddingBottom: 12, borderBottom: '1px solid #f0e6d3' }}>Récapitulatif</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          {infos.lignes.map(l => (
            <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
                {l.image_url ? <img src={l.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} /> : <div style={{ width: '100%', height: '100%', background: '#f5ecd9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>}
                <div style={{ position: 'absolute', top: -5, right: -5, minWidth: 18, height: 18, borderRadius: 9, background: c, color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{l.quantite}</div>
              </div>
              <span style={{ flex: 1, fontSize: 13, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.titre}{l.variante ? ` — ${l.variante}` : ''}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{argent(l.total_ligne, dev)}</span>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid #f0e6d3', paddingTop: 12 }}>
          {ligneRecap(`Sous-total (${infos.lignes.reduce((s, l) => s + l.quantite, 0)} art.)`, argent(infos.sous_total, dev))}
          <div style={{ display: 'flex', gap: 6, margin: '4px 0 10px' }}>
            <input value={codeSaisi} onChange={e => setCodeSaisi(e.target.value.toUpperCase())} onKeyDown={e => { if (e.key === 'Enter') setCodeApplique(codeSaisi.trim()); }} placeholder="Code promo" style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', padding: '8px 10px', border: '1px solid #e7d5b8', borderRadius: 8, fontSize: 13, background: '#fff', outline: 'none' }} />
            <button onClick={() => setCodeApplique(codeSaisi.trim())} style={{ border: '1px solid #e7d5b8', background: '#fff', borderRadius: 8, padding: '0 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#92400e' }}>Appliquer</button>
          </div>
          {infos.code_erreur && <div style={{ color: '#b91c1c', fontSize: 12, margin: '-4px 0 8px' }}>{infos.code_erreur}</div>}
          {t && t.rabais ? ligneRecap(`Code ${infos.code_promo ? infos.code_promo.code : ''}`, `− ${argent(t.rabais, dev)}`, { vert: true }) : null}
          {ligneRecap(choixExp ? `Expédition — ${choixExp.nom || choixExp.transporteur_nom || 'Livraison'}` : 'Expédition', t ? (t.frais_expedition === 0 ? 'Gratuite' : argent(t.frais_expedition, dev)) : '—', { vert: !!t && t.frais_expedition === 0, note: choixExp ? choixExp.delais_estime : undefined })}
          {t ? (t.taxes.total_taxes > 0 ? ligneRecap(`Taxes (${t.taxes.label})`, argent(t.taxes.total_taxes, dev)) : ligneRecap('Taxes', argent(0, dev), { gris: true })) : ligneRecap('Taxes', '—', { gris: true, note: 'Choisissez une adresse et un mode d’expédition' })}
          {montantTip > 0 && ligneRecap('Pourboire', argent(montantTip, dev), { gris: true })}
        </div>
        <div style={{ background: 'linear-gradient(135deg, #fef9ee, #fef3c7)', border: '1px solid #e7d5b8', borderRadius: 12, padding: 14, margin: '12px 0 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 15, fontWeight: 700 }}>Total</span><span style={{ fontSize: 24, fontWeight: 900, color: c }}>{totalAffiche !== null ? argent(totalAffiche, dev) : '—'}</span></div>
          {infos.totaux_erreur && livSel && <p style={{ fontSize: 11, color: '#b91c1c', margin: '6px 0 0' }}>{infos.totaux_erreur}</p>}
        </div>
        {mode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #e7d5b8', borderRadius: 10, padding: '8px 12px', marginBottom: 14 }}>
            <span style={{ fontSize: 18 }}>{mode === 'stripe' ? '💳' : '🅿️'}</span>
            <div><div style={{ fontSize: 13, fontWeight: 700 }}>{mode === 'stripe' ? 'Carte bancaire' : 'PayPal'}</div><div style={{ fontSize: 11, color: '#a8926a' }}>Paiement sécurisé SSL</div></div>
            <span style={{ marginLeft: 'auto', color: '#16a34a' }}>🔒</span>
          </div>
        )}
        <button className="cbq-payer" onClick={payer} disabled={!pret}
          style={{ width: '100%', padding: 16, background: pret ? degrade : '#d6d3d1', color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 800, cursor: pret ? 'pointer' : 'not-allowed', transition: 'all 0.2s', boxShadow: pret ? '0 6px 20px rgba(0,0,0,0.15)' : 'none', marginBottom: 10 }}>{libelleBouton}</button>
        <button onClick={() => naviguerVers('panier')} style={{ width: '100%', padding: 11, background: 'transparent', color: '#92400e', border: '1px solid #e7d5b8', borderRadius: 12, fontSize: 14, cursor: 'pointer' }}>← Retour au panier</button>
        <p style={{ fontSize: 11, color: '#a8926a', textAlign: 'center', margin: '12px 0 0', lineHeight: 1.6 }}>
          En passant votre commande, vous acceptez les{' '}
          <button className="cbq-lien" onClick={() => naviguerVers('conditions-service')} style={{ ...lienBtn, fontSize: 11 }}>conditions de service</button>{' '}et la{' '}
          <button className="cbq-lien" onClick={() => naviguerVers('confidentialite')} style={{ ...lienBtn, fontSize: 11 }}>politique de confidentialité</button>.
        </p>
      </div>
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span>🔒</span><span style={{ fontSize: 12, color: '#166534' }}>SSL 256 bits — Paiement 100 % sécurisé</span>
      </div>
    </div>
  );

  return (
    <div ref={setZone} style={racine}>
      <style>{CSS}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
        <button onClick={() => naviguerVers('panier')} style={{ background: '#fff', border: '1px solid #e7d5b8', borderRadius: 10, padding: '8px 14px', color: '#92400e', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>← Panier</button>
        <h1 style={{ margin: 0, fontSize: mobile ? 20 : 24, fontWeight: 800 }}>Paiement</h1>
        <span style={{ fontSize: 12, color: '#a8926a', whiteSpace: 'nowrap' }}>🔒 {mobile ? 'Sécurisé' : 'Connexion sécurisée'}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: mobile ? 4 : 6, marginBottom: 20, overflowX: 'auto' }}>
        {ETAPES.map((e, i) => (
          <div key={e} style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: i <= etapeActive ? degrade : '#fff', border: `2px solid ${i <= etapeActive ? c : '#e7d5b8'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: i <= etapeActive ? '#fff' : '#a8926a' }}>{i < etapeActive ? '✓' : i + 1}</div>
            {(!mobile || i === etapeActive) && <span style={{ fontSize: 13, fontWeight: i === etapeActive ? 700 : 400, color: i <= etapeActive ? '#1c1917' : '#a8926a' }}>{e}</span>}
            {i < ETAPES.length - 1 && <div style={{ width: mobile ? 18 : 40, height: 2, background: i < etapeActive ? c : '#e7d5b8', borderRadius: 2, margin: '0 4px' }} />}
          </div>
        ))}
      </div>
      <div style={{ display: deuxColonnes ? 'grid' : 'flex', gridTemplateColumns: deuxColonnes ? 'minmax(0,1fr) 380px' : undefined, flexDirection: 'column', gap: 20, alignItems: 'start' }}>
        {colGauche}
        {recap}
      </div>
    </div>
  );
}