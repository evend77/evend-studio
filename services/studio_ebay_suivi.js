// CHEMIN : services/studio_ebay_suivi.js
// e-Vend Studio — Connecteur eBay : suivi des changements après l'import.
// Adapté de suivreChangementsEbay (e-Vend). Toutes les 60 à 240 minutes (plus c'est calme, plus c'est espacé) on demande à eBay
// ce qui a changé (GetSellerEvents) : stock, annonces terminées, nouvelles annonces. Une fois par semaine, relecture légère de la
// liste complète (filet de sécurité). Le PRIX n'est jamais modifié automatiquement. Aucun effet sur eBay : lecture seule.

const pool = require('../db');
const svc = require('./studio_ebay');
const imp = require('./studio_ebay_import');
const regles = require('./studio_regles_produits');
const addons = require('./studio_addons');

const { trading, reserver, valeur, blocs, brut, QuotaEbay } = imp;
const BASE_MIN = parseInt(process.env.EBAY_SUIVI_BASE_MIN || '60', 10);
const MAX_MIN = parseInt(process.env.EBAY_SUIVI_MAX_MIN || '240', 10);
const FENETRE_MAX_H = 48;          // plus long : eBay ne garantit plus l'historique → relecture complète
const COMPLET_JOURS = 7;
const SEUIL_EVENEMENTS = 500;
const LIMITE_SUIVI_JOUR = 1500;    // appels de suivi par gestionnaire et par jour

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
async function appliquer(cid, items, gererStock) {
  if (!items.length) return { maj: 0, inconnus: [] };
  const ids = items.map((i) => i.id), stocks = items.map((i) => i.stock), fin = items.map((i) => !!i.termine);
  let maj = 0;
  if (gererStock) {
    const r = await pool.query(
      `UPDATE produits p SET stock = v.stock, ebay_termine_le = CASE WHEN v.termine THEN COALESCE(p.ebay_termine_le, NOW()) ELSE NULL END,
              ebay_synced_at = NOW(), updated_at = NOW()
         FROM unnest($1::text[], $2::int[], $3::boolean[]) AS v(item_id, stock, termine)
        WHERE p.collaborateur_id = $4 AND p.ebay_item_id = v.item_id
          AND (p.stock IS DISTINCT FROM v.stock OR (v.termine AND p.ebay_termine_le IS NULL) OR (NOT v.termine AND p.ebay_termine_le IS NOT NULL))`,
      [ids, stocks, fin, cid]);
    maj = r.rowCount;
  }
  const actifs = items.filter((i) => !i.termine).map((i) => i.id);
  let inconnus = [];
  if (actifs.length) {
    const connus = await pool.query('SELECT ebay_item_id FROM produits WHERE collaborateur_id = $1 AND ebay_item_id = ANY($2::text[])', [cid, actifs]);
    const set = new Set(connus.rows.map((r) => String(r.ebay_item_id)));
    inconnus = actifs.filter((id) => !set.has(id));
  }
  return { maj, inconnus };
}

async function noterNouvelles(cid, ids) {
  if (!ids.length) return 0;
  const r = await pool.query('INSERT INTO ebay_nouvelles (collaborateur_id, ebay_item_id) SELECT $1, unnest($2::text[]) ON CONFLICT DO NOTHING', [cid, ids]);
  return r.rowCount;
}

const versItem = (i) => ({ id: i.id, termine: i.termine, stock: i.termine ? 0 : Math.max((i.quantite || 0) - i.vendus, 0) });

// Relecture légère de TOUTE la liste active : stock, annonces terminées (absentes de la liste), nouvelles annonces
async function controleComplet(c, env, jeton, gererStock) {
  const vus = new Set(); let maj = 0, total = 0, sansQte = 0; const inconnus = [];
  for await (const page of pagesLegeres(env, jeton)) {
    await reserver(c.gestionnaire_id, 'Suivi', 1, LIMITE_SUIVI_JOUR);
    const items = [];
    for (const i of page) {
      total++; vus.add(i.id);
      if (i.quantite === null) { sansQte++; continue; }   // jamais « 0 » par défaut si la quantité manque
      items.push(versItem({ ...i, termine: false }));
    }
    const r = await appliquer(c.collaborateur_id, items, gererStock);
    maj += r.maj; inconnus.push(...r.inconnus);
  }
  if (total > 0 && sansQte / total > 0.5) throw new Error('Réponse eBay inattendue (quantités absentes) : contrôle annulé par sécurité');
  let terminees = 0;
  if (vus.size > 0 && gererStock) {
    const n = +(await pool.query('SELECT COUNT(*)::int n FROM produits WHERE collaborateur_id = $1 AND ebay_item_id IS NOT NULL AND ebay_termine_le IS NULL', [c.collaborateur_id])).rows[0].n;
    const absents = Math.max(n - vus.size, 0);
    // Garde-fou : une réponse vide ou partielle d'eBay ne doit jamais mettre tout un catalogue à zéro
    if (!(absents > 25 && absents > n * 0.5)) {
      const r = await pool.query(
        `UPDATE produits SET stock = 0, ebay_termine_le = NOW(), updated_at = NOW(), ebay_synced_at = NOW()
          WHERE collaborateur_id = $1 AND ebay_item_id IS NOT NULL AND ebay_termine_le IS NULL AND NOT (ebay_item_id = ANY($2::text[]))`,
        [c.collaborateur_id, [...vus]]);
      terminees = r.rowCount;
    }
  }
  return { maj: maj + terminees, nouveaux: await noterNouvelles(c.collaborateur_id, inconnus), complet: true };
}

// Suivi d'UNE connexion. Retourne un résumé ; ne lance rien d'autre.
async function suivreUne(c) {
  const cid = c.collaborateur_id, gid = c.gestionnaire_id;
  const debut = new Date();
  const modFrom = c.dernier_suivi ? new Date(c.dernier_suivi) : null;
  const complet = !modFrom || (debut - modFrom) > FENETRE_MAX_H * 3600 * 1000 ||
    !c.dernier_complet || (debut - new Date(c.dernier_complet)) > COMPLET_JOURS * 86400 * 1000;
  try {
    const cfg = await svc.configGestionnaire(gid);
    if (!cfg) throw new svc.ErreurEbay("Configuration eBay du gestionnaire incomplète.", 409);
    const jeton = await svc.obtenirJeton(cid);
    const gererStock = (await regles.lire(gid, pool)).gererStock;
    let res = null, complet2 = complet;
    if (!complet) {
      try {
        await reserver(gid, 'Suivi', 1, LIMITE_SUIVI_JOUR);
        const evts = await evenements(cfg.env, jeton, modFrom, debut);
        if (evts.length >= SEUIL_EVENEMENTS || evts.some((i) => i.quantite === null)) res = null;     // pas fiable → relecture complète
        else {
          const r = await appliquer(cid, evts.map(versItem), gererStock);
          res = { maj: r.maj, nouveaux: await noterNouvelles(cid, r.inconnus), complet: false };
        }
      } catch (e) { if (e.quota || e.code === 'reconnexion') throw e; console.warn('[ebay-suivi] GetSellerEvents :', e.message); }
      if (!res) { res = await controleComplet(c, cfg.env, jeton, gererStock); complet2 = true; }
    } else res = await controleComplet(c, cfg.env, jeton, gererStock);

    const changements = (res.maj || 0) + (res.nouveaux || 0);
    const calmes = changements > 0 ? 0 : (c.calmes || 0) + 1;
    const resume = changements > 0
      ? `${res.maj || 0} annonce(s) mise(s) à jour${res.nouveaux ? `, ${res.nouveaux} nouvelle(s) annonce(s) trouvée(s) sur eBay` : ''}`
      : null;
    await pool.query(
      `UPDATE ebay_connexions SET dernier_suivi = $2, prochain_suivi = NOW() + ($3::int * interval '1 minute'), calmes = $4,
              dernier_complet = CASE WHEN $5::boolean THEN NOW() ELSE dernier_complet END, suivi_erreur = NULL,
              dernier_resume = COALESCE($6, dernier_resume), dernier_changement_le = CASE WHEN $6::text IS NOT NULL THEN NOW() ELSE dernier_changement_le END
        WHERE collaborateur_id = $1`,
      [cid, debut, intervalle(calmes), calmes, complet2, resume]);
    return res;
  } catch (e) {
    if (e.quota) { await pool.query(`UPDATE ebay_connexions SET prochain_suivi = NOW() + interval '30 minutes' WHERE collaborateur_id = $1`, [cid]); return null; }
    if (e.code === 'reconnexion') { await pool.query(`UPDATE ebay_connexions SET prochain_suivi = NOW() + interval '6 hours' WHERE collaborateur_id = $1`, [cid]); return null; }
    console.warn('[ebay-suivi] collaborateur', cid, ':', e.message);
    await pool.query(`UPDATE ebay_connexions SET prochain_suivi = NOW() + interval '30 minutes', suivi_erreur = $2 WHERE collaborateur_id = $1`, [cid, String(e.message).slice(0, 300)]);
    return null;
  }
}

// Prend UNE connexion dont c'est le tour (jamais pendant un import) et la suit
async function prochainSuivi() {
  const r = await pool.query(
    `SELECT c.* FROM ebay_connexions c
      WHERE c.statut = 'connecte' AND (c.prochain_suivi IS NULL OR c.prochain_suivi <= NOW())
        AND EXISTS (SELECT 1 FROM produits p WHERE p.collaborateur_id = c.collaborateur_id AND p.ebay_item_id IS NOT NULL)
        AND NOT EXISTS (SELECT 1 FROM ebay_jobs j WHERE j.collaborateur_id = c.collaborateur_id AND j.statut IN ('en_attente','en_cours','pause'))
      ORDER BY c.prochain_suivi NULLS FIRST LIMIT 1`);
  const c = r.rows[0];
  if (!c) return false;
  // Réserve la place tout de suite (évite un double passage si ça dure)
  await pool.query(`UPDATE ebay_connexions SET prochain_suivi = NOW() + interval '15 minutes' WHERE collaborateur_id = $1`, [c.collaborateur_id]);
  try { if (!(await addons.addonActifRapide(c.gestionnaire_id, 'connecteur_ebay', pool))) return true; }
  catch (e) { return true; }
  await suivreUne(c);
  return true;
}

// Le collaborateur demande « Vérifier maintenant » : le prochain passage du worker le prend
async function demanderVerification(cid, gid) {
  const r = await pool.query(`UPDATE ebay_connexions SET prochain_suivi = NOW() WHERE collaborateur_id = $1 AND gestionnaire_id = $2 AND statut = 'connecte' RETURNING 1`, [cid, gid]);
  return r.rowCount > 0;
}

async function etatSuivi(cid, gid) {
  const r = await pool.query(
    `SELECT c.dernier_suivi, c.prochain_suivi, c.dernier_resume, c.dernier_changement_le, c.suivi_erreur,
            (SELECT COUNT(*)::int FROM ebay_nouvelles n WHERE n.collaborateur_id = c.collaborateur_id) AS nouvelles
       FROM ebay_connexions c WHERE c.collaborateur_id = $1 AND c.gestionnaire_id = $2`, [cid, gid]);
  return r.rows[0] || null;
}

module.exports = { prochainSuivi, demanderVerification, etatSuivi, suivreUne, intervalle };