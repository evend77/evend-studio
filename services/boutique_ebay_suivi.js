// CHEMIN : services/boutique_ebay_suivi.js
// e-Vend Studio — Connecteur eBay (boutique solo) : suivi des changements après l'import.
// Adapté de services/studio_ebay_suivi.js (MV), pour UNE connexion par boutique. Toutes les 60 à 240 minutes (plus c'est calme, plus c'est espacé) on demande
// à eBay ce qui a changé (GetSellerEvents) : stock, annonces terminées, nouvelles annonces. Une fois par semaine, relecture légère de la liste complète
// (filet de sécurité). Le PRIX n'est jamais modifié automatiquement. Aucun effet sur eBay : lecture seule.

'use strict';

const pool = require('../db');
const svc = require('./boutique_ebay');
const imp = require('./boutique_ebay_import');

const { trading, reserver, valeur, blocs, brut } = imp;
const BASE_MIN = parseInt(process.env.EBAY_SUIVI_BASE_MIN || '60', 10);
const MAX_MIN = parseInt(process.env.EBAY_SUIVI_MAX_MIN || '240', 10);
const FENETRE_MAX_H = 48;          // plus long : eBay ne garantit plus l'historique → relecture complète
const COMPLET_JOURS = 7;
const SEUIL_EVENEMENTS = 500;
const LIMITE_SUIVI_JOUR = 1500;    // appels de suivi par boutique et par jour

function intervalle(calmes) {
  const base = Math.min(BASE_MIN * Math.pow(2, Math.floor((calmes || 0) / 3)), MAX_MIN);
  return Math.round(base * (0.9 + Math.random() * 0.2));
}

// ─── Lecture d'eBay ───────────────────────────────────────────────────────────
function lireItem(xml) {
  const vente = brut(xml, 'SellingStatus') || '';
  const q = valeur(xml, 'Quantity');
  const statut = valeur(vente, 'ListingStatus');
  const vendus = parseInt(valeur(vente, 'QuantitySold') || '0', 10) || 0;
  return { id: valeur(xml, 'ItemID'), quantite: q === null ? null : (parseInt(q, 10) || 0), vendus, termine: !!statut && statut !== 'Active' };
}

async function evenements(env, jeton, de, a) {
  const xml = await trading(env, jeton, 'GetSellerEvents', `
  <ModTimeFrom>${de.toISOString()}</ModTimeFrom><ModTimeTo>${a.toISOString()}</ModTimeTo>
  <OutputSelector>ItemArray.Item.ItemID</OutputSelector><OutputSelector>ItemArray.Item.Quantity</OutputSelector>
  <OutputSelector>ItemArray.Item.SellingStatus.QuantitySold</OutputSelector><OutputSelector>ItemArray.Item.SellingStatus.ListingStatus</OutputSelector>`);
  return blocs(brut(xml, 'ItemArray') || '', 'Item').map(lireItem).filter((i) => i.id);
}

async function* pagesLegeres(env, jeton) {
  let page = 1, pages = 1;
  do {
    const xml = await trading(env, jeton, 'GetMyeBaySelling', `
    <ActiveList><Include>true</Include><Pagination><EntriesPerPage>200</EntriesPerPage><PageNumber>${page}</PageNumber></Pagination></ActiveList>
    <OutputSelector>ActiveList.ItemArray.Item.ItemID</OutputSelector><OutputSelector>ActiveList.ItemArray.Item.Quantity</OutputSelector>
    <OutputSelector>ActiveList.ItemArray.Item.SellingStatus.QuantitySold</OutputSelector><OutputSelector>ActiveList.PaginationResult</OutputSelector>`);
    const liste = brut(xml, 'ActiveList');
    if (liste === null) return;
    pages = parseInt(valeur(liste, 'TotalNumberOfPages') || '1', 10) || 1;
    yield blocs(liste, 'Item').map(lireItem).filter((i) => i.id);
    page++;
  } while (page <= pages);
}

// ─── Application des changements (un seul UPDATE par lot, seulement ce qui change) ───
// items : [{ id, stock, termine }] — retourne { maj, inconnus }
async function appliquer(gid, items) {
  if (!items.length) return { maj: 0, inconnus: [] };
  const ids = items.map((i) => i.id), stocks = items.map((i) => i.stock), fin = items.map((i) => !!i.termine);
  const r = await pool.query(
    `UPDATE produits p SET stock = v.stock, ebay_termine_le = CASE WHEN v.termine THEN COALESCE(p.ebay_termine_le, NOW()) ELSE NULL END, ebay_synced_at = NOW(), updated_at = NOW()
       FROM unnest($1::text[], $2::int[], $3::boolean[]) AS v(item_id, stock, termine)
      WHERE p.gestionnaire_id = $4 AND p.collaborateur_id IS NULL AND p.ebay_item_id = v.item_id
        AND (p.stock IS DISTINCT FROM v.stock OR (v.termine AND p.ebay_termine_le IS NULL) OR (NOT v.termine AND p.ebay_termine_le IS NOT NULL))`,
    [ids, stocks, fin, gid]);
  const actifs = items.filter((i) => !i.termine).map((i) => i.id);
  let inconnus = [];
  if (actifs.length) {
    const connus = await pool.query('SELECT ebay_item_id FROM boutique_ebay_annonces WHERE gestionnaire_id = $1 AND ebay_item_id = ANY($2::text[])', [gid, actifs]);
    const set = new Set(connus.rows.map((x) => String(x.ebay_item_id)));
    inconnus = actifs.filter((id) => !set.has(id));
  }
  return { maj: r.rowCount, inconnus };
}

async function noterNouvelles(gid, ids) {
  if (!ids.length) return 0;
  const r = await pool.query('INSERT INTO boutique_ebay_nouvelles (gestionnaire_id, ebay_item_id) SELECT $1, unnest($2::text[]) ON CONFLICT DO NOTHING', [gid, ids]);
  return r.rowCount;
}

const versItem = (i) => ({ id: i.id, termine: i.termine, stock: i.termine ? 0 : Math.max((i.quantite || 0) - i.vendus, 0) });

// Relecture légère de TOUTE la liste active : stock, annonces terminées (absentes de la liste), nouvelles annonces
async function controleComplet(gid, env, jeton) {
  const vus = new Set(); let maj = 0, total = 0, sansQte = 0; const inconnus = [];
  for await (const page of pagesLegeres(env, jeton)) {
    await reserver(gid, 'Suivi', 1, LIMITE_SUIVI_JOUR);
    const items = [];
    for (const i of page) {
      total++; vus.add(i.id);
      if (i.quantite === null) { sansQte++; continue; }   // jamais « 0 » par défaut si la quantité manque
      items.push(versItem({ ...i, termine: false }));
    }
    const r = await appliquer(gid, items);
    maj += r.maj; inconnus.push(...r.inconnus);
  }
  if (total > 0 && sansQte / total > 0.5) throw new Error('Réponse eBay inattendue (quantités absentes) : contrôle annulé par sécurité');
  let terminees = 0;
  if (vus.size > 0) {
    const n = +(await pool.query('SELECT COUNT(*)::int n FROM produits WHERE gestionnaire_id = $1 AND collaborateur_id IS NULL AND ebay_item_id IS NOT NULL AND ebay_termine_le IS NULL', [gid])).rows[0].n;
    const absents = Math.max(n - vus.size, 0);
    // Garde-fou : une réponse vide ou partielle d'eBay ne doit jamais mettre tout un catalogue à zéro
    if (!(absents > 25 && absents > n * 0.5)) {
      const r = await pool.query(
        `UPDATE produits SET stock = 0, ebay_termine_le = NOW(), updated_at = NOW(), ebay_synced_at = NOW()
          WHERE gestionnaire_id = $1 AND collaborateur_id IS NULL AND ebay_item_id IS NOT NULL AND ebay_termine_le IS NULL AND NOT (ebay_item_id = ANY($2::text[]))`,
        [gid, [...vus]]);
      terminees = r.rowCount;
    }
  }
  return { maj: maj + terminees, nouveaux: await noterNouvelles(gid, inconnus), complet: true };
}

// Suivi de la connexion d'une boutique. Retourne un résumé.
async function suivreUne(c) {
  const gid = c.gestionnaire_id;
  const debut = new Date();
  const modFrom = c.dernier_suivi ? new Date(c.dernier_suivi) : null;
  const complet = !modFrom || (debut - modFrom) > FENETRE_MAX_H * 3600 * 1000 ||
    !c.dernier_complet || (debut - new Date(c.dernier_complet)) > COMPLET_JOURS * 86400 * 1000;
  try {
    const cfg = await svc.configGestionnaire(gid);
    if (!cfg) throw new svc.ErreurEbay('Configuration eBay incomplète.', 409);
    const jeton = await svc.obtenirJeton(gid);
    let res = null, complet2 = complet;
    if (!complet) {
      try {
        await reserver(gid, 'Suivi', 1, LIMITE_SUIVI_JOUR);
        const evts = await evenements(cfg.env, jeton, modFrom, debut);
        if (evts.length >= SEUIL_EVENEMENTS || evts.some((i) => i.quantite === null)) res = null;     // pas fiable → relecture complète
        else {
          const r = await appliquer(gid, evts.map(versItem));
          res = { maj: r.maj, nouveaux: await noterNouvelles(gid, r.inconnus), complet: false };
        }
      } catch (e) { if (e.quota || e.code === 'reconnexion') throw e; console.warn('[boutique-ebay-suivi] GetSellerEvents :', e.message); }
      if (!res) { res = await controleComplet(gid, cfg.env, jeton); complet2 = true; }
    } else res = await controleComplet(gid, cfg.env, jeton);

    const changements = (res.maj || 0) + (res.nouveaux || 0);
    const calmes = changements > 0 ? 0 : (c.calmes || 0) + 1;
    const resume = changements > 0
      ? `${res.maj || 0} annonce(s) mise(s) à jour${res.nouveaux ? `, ${res.nouveaux} nouvelle(s) annonce(s) trouvée(s) sur eBay` : ''}`
      : null;
    await pool.query(
      `UPDATE boutique_ebay_connexion SET dernier_suivi = $2, prochain_suivi = NOW() + ($3::int * interval '1 minute'), calmes = $4,
              dernier_complet = CASE WHEN $5::boolean THEN NOW() ELSE dernier_complet END, suivi_erreur = NULL,
              dernier_resume = COALESCE($6, dernier_resume), dernier_changement_le = CASE WHEN $6::text IS NOT NULL THEN NOW() ELSE dernier_changement_le END
        WHERE gestionnaire_id = $1`,
      [gid, debut, intervalle(calmes), calmes, complet2, resume]);
    return res;
  } catch (e) {
    if (e.quota) { await pool.query(`UPDATE boutique_ebay_connexion SET prochain_suivi = NOW() + interval '30 minutes' WHERE gestionnaire_id = $1`, [gid]); return null; }
    if (e.code === 'reconnexion') { await pool.query(`UPDATE boutique_ebay_connexion SET prochain_suivi = NOW() + interval '6 hours' WHERE gestionnaire_id = $1`, [gid]); return null; }
    console.warn('[boutique-ebay-suivi] boutique', gid, ':', e.message);
    await pool.query(`UPDATE boutique_ebay_connexion SET prochain_suivi = NOW() + interval '30 minutes', suivi_erreur = $2 WHERE gestionnaire_id = $1`, [gid, String(e.message).slice(0, 300)]);
    return null;
  }
}

// Prend UNE connexion dont c'est le tour (jamais pendant un import) et la suit
async function prochainSuivi() {
  const r = await pool.query(
    `SELECT c.* FROM boutique_ebay_connexion c
      WHERE c.statut = 'connecte' AND (c.prochain_suivi IS NULL OR c.prochain_suivi <= NOW())
        AND EXISTS (SELECT 1 FROM boutique_ebay_annonces a WHERE a.gestionnaire_id = c.gestionnaire_id)
        AND NOT EXISTS (SELECT 1 FROM boutique_ebay_jobs j WHERE j.gestionnaire_id = c.gestionnaire_id AND j.statut IN ('en_attente','en_cours','pause'))
      ORDER BY c.prochain_suivi NULLS FIRST LIMIT 1`);
  const c = r.rows[0];
  if (!c) return false;
  // Réserve la place tout de suite (évite un double passage si ça dure)
  await pool.query(`UPDATE boutique_ebay_connexion SET prochain_suivi = NOW() + interval '15 minutes' WHERE gestionnaire_id = $1`, [c.gestionnaire_id]);
  try { if (!(await svc.autorise(c.gestionnaire_id))) return true; } catch (e) { return true; }
  await suivreUne(c);
  return true;
}

// « Vérifier maintenant » : le prochain passage du worker le prend
async function demanderVerification(gid) {
  const r = await pool.query(`UPDATE boutique_ebay_connexion SET prochain_suivi = NOW() WHERE gestionnaire_id = $1 AND statut = 'connecte' RETURNING 1`, [gid]);
  return r.rowCount > 0;
}

async function etatSuivi(gid) {
  const r = await pool.query(
    `SELECT c.dernier_suivi, c.prochain_suivi, c.dernier_resume, c.dernier_changement_le, c.suivi_erreur,
            (SELECT COUNT(*)::int FROM boutique_ebay_nouvelles n WHERE n.gestionnaire_id = c.gestionnaire_id) AS nouvelles
       FROM boutique_ebay_connexion c WHERE c.gestionnaire_id = $1`, [gid]);
  return r.rows[0] || null;
}

module.exports = { prochainSuivi, demanderVerification, etatSuivi, suivreUne, intervalle };