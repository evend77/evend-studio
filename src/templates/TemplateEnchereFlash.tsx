// src/templates/TemplateEnchereFlash.tsx
// e-Vend Studio — Enchère Flash — Un produit, une page, tension maximale

import { useState, useEffect, useRef } from 'react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface ConfigEnchereFlash {
  // Identité
  nomBoutique:       string;
  logoUrl:           string;
  couleurPrincipale: string;   // ex: '#dc2626' rouge
  couleurSecondaire: string;   // ex: '#1a1a1a'
  police:            'moderne' | 'classique' | 'impact';

  // Produit
  nomProduit:        string;
  descriptionCourte: string;
  descriptionLongue: string;
  photos:            string[];
  conditionProduit:  string;   // 'Neuf', 'Excellent', 'Bon état', etc.

  // Enchère
  prixBase:          number;
  prixReserve?:      number;
  dateDebut:         string;   // ISO
  dateFin:           string;   // ISO
  incrementMin:      number;
  montantsSuggeres:  number[]; // mises rapides suggérées

  // Contact / vendeur
  nomVendeur:        string;
  email:             string;
  telephone?:        string;
  politiqueRetour:   string;
}

export const CONFIG_ENCHERE_FLASH_DEFAUT: ConfigEnchereFlash = {
  nomBoutique:       'Flash Enchères',
  logoUrl:           '',
  couleurPrincipale: '#dc2626',
  couleurSecondaire: '#0f0f0f',
  police:            'moderne',

  nomProduit:        'Apple MacBook Pro M4 — 14"',
  descriptionCourte: 'Utilisé 3 mois, comme neuf. Boîte originale, tous accessoires inclus.',
  descriptionLongue: `Voici un MacBook Pro M4 14 pouces en parfait état. Acheté en janvier 2026, utilisé très peu.\n\n**Inclus :**\n• Boîte originale + câble MagSafe\n• Chargeur 96W\n• Apple Care+ jusqu'en janvier 2028\n\n**Specs :**\n• Puce M4 Pro — 12 cœurs CPU\n• 24 Go de RAM unifiée\n• 512 Go SSD\n• Couleur : Gris Sidéral`,
  photos:            [
    'https://images.pexels.com/photos/303383/pexels-photo-303383.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  conditionProduit:  'Comme neuf',
  prixBase:          1200,
  prixReserve:       1800,
  dateDebut:         new Date().toISOString(),
  dateFin:           new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  incrementMin:      25,
  montantsSuggeres:  [25, 50, 100, 200],
  nomVendeur:        'Jean Tremblay',
  email:             'vente@exemple.com',
  telephone:         '514-555-0000',
  politiqueRetour:   'Vente ferme — aucun retour accepté.',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function useTimer(dateFin: string) {
  const calc = () => {
    const diff = new Date(dateFin).getTime() - Date.now();
    if (diff <= 0) return { j: 0, h: 0, m: 0, s: 0, expire: true };
    return {
      j: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
      expire: false,
    };
  };
  const [t, setT] = useState(calc());
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, [dateFin]);
  return t;
}

function getPolice(p: string) {
  if (p === 'classique') return "'Playfair Display', Georgia, serif";
  if (p === 'impact') return "'Impact', 'Oswald', sans-serif";
  return "'Inter', sans-serif";
}

function pad(n: number) { return String(n).padStart(2, '0'); }

// ─── WIDGET MISE AUTO-CONTENU ─────────────────────────────────────────────────

interface BidState {
  miseCourante: number;
  nbMises: number;
  historique: { nom: string; montant: number; date: string }[];
  statut: 'a_venir' | 'en_cours' | 'terminee';
}

function BidWidget({
  config, siteId, vendeurId, police, cp,
}: {
  config: ConfigEnchereFlash;
  siteId?: number;
  vendeurId?: number;
  police: string;
  cp: string;
}) {
  const t = useTimer(config.dateFin);
  const debut = useTimer(config.dateDebut);
  const [bid, setBid] = useState<BidState>({
    miseCourante: config.prixBase,
    nbMises: 0,
    historique: [],
    statut: new Date(config.dateDebut) > new Date() ? 'a_venir' : t.expire ? 'terminee' : 'en_cours',
  });
  const [montant, setMontant] = useState(config.prixBase + config.incrementMin);
  const [nom, setNom]         = useState('');
  const [email, setEmail]     = useState('');
  const [erreur, setErreur]   = useState('');
  const [succes, setSucces]   = useState('');
  const [envoi, setEnvoi]     = useState(false);

  // Polling mise courante
  useEffect(() => {
    if (!siteId) return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/encheres-studio/public/${siteId}`);
        if (res.ok) {
          const d = await res.json();
          setBid(prev => ({
            ...prev,
            miseCourante: d.mise_courante || prev.miseCourante,
            nbMises: d.nb_mises || prev.nbMises,
            historique: d.historique || prev.historique,
            statut: d.statut || prev.statut,
          }));
        }
      } catch {}
    };
    poll();
    const id = setInterval(poll, 8000);
    return () => clearInterval(id);
  }, [siteId]);

  const placerMise = async () => {
    if (!nom.trim()) { setErreur('Entrez votre prénom / surnom.'); return; }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setErreur('Entrez un courriel valide.'); return; }
    if (montant < bid.miseCourante + config.incrementMin) {
      setErreur(`La mise minimum est de ${(bid.miseCourante + config.incrementMin).toFixed(2)} $.`);
      return;
    }
    setEnvoi(true); setErreur(''); setSucces('');
    try {
      if (siteId) {
        const res = await fetch('/api/encheres-studio/miser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ site_id: siteId, vendeur_id: vendeurId, montant, nom_encherisseur: nom.trim(), email_encherisseur: email.trim() }),
        });
        const d = await res.json();
        if (!res.ok) { setErreur(d.message || 'Erreur.'); return; }
        setBid(prev => ({ ...prev, miseCourante: montant, nbMises: prev.nbMises + 1, historique: [{ nom, montant, date: new Date().toISOString() }, ...prev.historique] }));
      } else {
        // Mode démo
        setBid(prev => ({ ...prev, miseCourante: montant, nbMises: prev.nbMises + 1, historique: [{ nom, montant, date: new Date().toISOString() }, ...prev.historique] }));
      }
      setSucces(`✅ Votre mise de ${montant.toFixed(2)} $ a été enregistrée!`);
      setMontant(montant + config.incrementMin);
    } catch { setErreur('Erreur réseau. Réessayez.'); }
    finally { setEnvoi(false); }
  };

  const urgence = !t.expire && t.j === 0 && t.h < 2;
  const aVenir = bid.statut === 'a_venir';
  const terminee = bid.statut === 'terminee' || t.expire;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.08)',
    border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 8,
    color: '#fff', fontSize: 14, outline: 'none', fontFamily: police, boxSizing: 'border-box',
  };

  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, border: `1px solid ${urgence ? cp + '60' : 'rgba(255,255,255,0.1)'}`, overflow: 'hidden', boxShadow: urgence ? `0 0 32px ${cp}30` : 'none' }}>

      {/* Barre statut */}
      <div style={{ background: terminee ? '#374151' : aVenir ? '#1d4ed8' : urgence ? cp : '#16a34a', padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {terminee ? '⬛ Enchère terminée' : aVenir ? '🔵 Débute bientôt' : urgence ? '🔴 DERNIÈRES HEURES' : '🟢 En cours'}
        </span>
        {!terminee && (
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
            {bid.nbMises} mise{bid.nbMises !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div style={{ padding: '20px 18px' }}>
        {/* Mise courante */}
        <div style={{ marginBottom: 18 }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
            {bid.nbMises === 0 ? 'Prix de départ' : 'Mise courante'}
          </p>
          <p style={{ fontSize: 42, fontWeight: 900, color: terminee ? '#9ca3af' : cp, margin: 0, lineHeight: 1, fontFamily: police }}>
            {bid.miseCourante.toFixed(2)} <span style={{ fontSize: 20, fontWeight: 600 }}>$</span>
          </p>
          {config.prixReserve && !terminee && (
            <p style={{ fontSize: 12, color: bid.miseCourante >= config.prixReserve ? '#4ade80' : 'rgba(255,255,255,0.35)', marginTop: 4 }}>
              {bid.miseCourante >= config.prixReserve ? '✅ Réserve atteinte' : '🔒 Réserve non atteinte'}
            </p>
          )}
        </div>

        {/* Compte à rebours */}
        {!terminee && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              {aVenir ? 'Débute dans' : 'Temps restant'}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {(aVenir ? [
                { v: debut.j, u: 'j' }, { v: debut.h, u: 'h' }, { v: debut.m, u: 'm' }, { v: debut.s, u: 's' }
              ] : [
                { v: t.j, u: 'j' }, { v: t.h, u: 'h' }, { v: t.m, u: 'm' }, { v: t.s, u: 's' }
              ]).map(({ v, u }) => (
                <div key={u} style={{ flex: 1, background: urgence ? cp + '25' : 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 4px', textAlign: 'center', border: urgence ? `1px solid ${cp}40` : '1px solid transparent' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: urgence ? cp : '#fff', lineHeight: 1 }}>{pad(v)}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2, textTransform: 'uppercase' }}>{u}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formulaire mise */}
        {!terminee && !aVenir && (
          <div>
            {succes && (
              <div style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#4ade80', fontSize: 13, fontWeight: 600 }}>
                {succes}
              </div>
            )}
            {erreur && (
              <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#f87171', fontSize: 13 }}>
                {erreur}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input style={inputStyle} placeholder="Votre prénom / surnom" value={nom} onChange={e => setNom(e.target.value)} />
              <input style={inputStyle} type="email" placeholder="Votre courriel (confidentiel)" value={email} onChange={e => setEmail(e.target.value)} />

              {/* Mises suggérées */}
              <div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Mise rapide (au-dessus de la mise courante) :</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {config.montantsSuggeres.map(m => {
                    const val = bid.miseCourante + m;
                    return (
                      <button key={m} onClick={() => setMontant(val)}
                        style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${montant === val ? cp : 'rgba(255,255,255,0.2)'}`, background: montant === val ? cp + '30' : 'transparent', color: montant === val ? cp : 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        +{m}$ → {val.toFixed(0)}$
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Montant custom */}
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>$</span>
                  <input
                    type="number" min={bid.miseCourante + config.incrementMin} step={config.incrementMin}
                    style={{ ...inputStyle, paddingLeft: 28 }}
                    value={montant} onChange={e => setMontant(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <button onClick={placerMise} disabled={envoi}
                  style={{ padding: '11px 20px', background: cp, border: 'none', borderRadius: 8, color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap', opacity: envoi ? 0.7 : 1, fontFamily: police }}>
                  {envoi ? '⏳' : '🔨 Miser'}
                </button>
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
                🔒 Mise minimum : {(bid.miseCourante + config.incrementMin).toFixed(2)} $
              </p>
            </div>
          </div>
        )}

        {terminee && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>🔨</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Cette enchère est terminée.</p>
            <p style={{ color: cp, fontWeight: 700, fontSize: 16, marginTop: 8 }}>Prix final : {bid.miseCourante.toFixed(2)} $</p>
          </div>
        )}
      </div>

      {/* Historique mises */}
      {bid.historique.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '14px 18px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Dernières mises</p>
          {bid.historique.slice(0, 5).map((h, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {i === 0 && <span style={{ fontSize: 10, background: cp, color: '#fff', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>TOP</span>}
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{h.nom}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: i === 0 ? cp : 'rgba(255,255,255,0.5)' }}>{h.montant.toFixed(2)} $</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TEMPLATE PRINCIPAL ───────────────────────────────────────────────────────

interface Props {
  config?: Partial<ConfigEnchereFlash>;
  siteId?: number;
  vendeurId?: number;
}

export default function TemplateEnchereFlash({ config: configProp, siteId, vendeurId }: Props) {
  const config = { ...CONFIG_ENCHERE_FLASH_DEFAUT, ...configProp };
  const cp     = config.couleurPrincipale;
  const cs     = config.couleurSecondaire;
  const police = getPolice(config.police);

  const [photoActive, setPhotoActive] = useState(0);
  const [isMobile, setIsMobile]       = useState(false);
  const [expanded, setExpanded]       = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: cs, color: '#fff', fontFamily: police }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        img { display: block; }
        button:hover { opacity: 0.88; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        .pulse { animation: pulse 1.5s ease-in-out infinite; }
        input::placeholder { color: rgba(255,255,255,0.3); }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${cp}44; border-radius: 4px; }
      `}</style>

      {/* NAV */}
      <nav style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {config.logoUrl
            ? <img src={config.logoUrl} alt="logo" style={{ height: 32, objectFit: 'contain' }} />
            : <div style={{ width: 32, height: 32, borderRadius: 8, background: cp, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16 }}>🔨</div>
          }
          <span style={{ fontWeight: 800, fontSize: 17 }}>{config.nomBoutique}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: cp }} />
          <span style={{ fontSize: 12, color: cp, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>En direct</span>
        </div>
      </nav>

      {/* CORPS */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '24px 16px' : '48px 24px', display: 'flex', gap: 40, flexDirection: isMobile ? 'column' : 'row', alignItems: 'flex-start' }}>

        {/* COLONNE GAUCHE — Photos + infos */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Galerie */}
          <div style={{ borderRadius: 16, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', marginBottom: 12, aspectRatio: '4/3', position: 'relative' }}>
            {config.photos[photoActive]
              ? <img src={config.photos[photoActive]} alt={config.nomProduit} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>📦</div>
            }
            {/* Badge condition */}
            <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
              <span style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                ✨ {config.conditionProduit}
              </span>
            </div>
          </div>

          {/* Miniatures */}
          {config.photos.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
              {config.photos.map((ph, i) => (
                <div key={i} onClick={() => setPhotoActive(i)}
                  style={{ width: 64, height: 48, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${i === photoActive ? cp : 'transparent'}`, flexShrink: 0 }}>
                  <img src={ph} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}

          {/* Nom + description */}
          <h1 style={{ fontSize: `clamp(22px, 4vw, 36px)`, fontWeight: 900, lineHeight: 1.15, marginBottom: 12 }}>
            {config.nomProduit}
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 20 }}>
            {config.descriptionCourte}
          </p>

          {/* Description longue (accordéon) */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20 }}>
            <button onClick={() => setExpanded(!expanded)}
              style={{ background: 'none', border: 'none', color: cp, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: police, marginBottom: expanded ? 14 : 0 }}>
              {expanded ? '▲' : '▼'} {expanded ? 'Réduire' : 'Voir la description complète'}
            </button>
            {expanded && (
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                {config.descriptionLongue}
              </div>
            )}
          </div>

          {/* Infos vendeur */}
          <div style={{ marginTop: 28, padding: '18px 20px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Vendeur</p>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{config.nomVendeur}</p>
            <a href={`mailto:${config.email}`} style={{ fontSize: 13, color: cp, textDecoration: 'none' }}>{config.email}</a>
            {config.telephone && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{config.telephone}</p>}
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 12, lineHeight: 1.5 }}>📋 {config.politiqueRetour}</p>
          </div>
        </div>

        {/* COLONNE DROITE — Widget mise (sticky) */}
        <div style={{ width: isMobile ? '100%' : 380, flexShrink: 0, position: isMobile ? 'static' : 'sticky', top: 80 }}>
          <BidWidget config={config} siteId={siteId} vendeurId={vendeurId} police={police} cp={cp} />
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
          {config.nomBoutique} — Propulsé par <span style={{ color: cp }}>e-Vend Studio Enchères</span>
        </p>
      </footer>
    </div>
  );
}