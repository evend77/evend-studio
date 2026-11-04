//CHEMIN : routes/sitemap.js
// Sitemap XML dynamique pour e-Vend Studio — GET /sitemap.xml (public)

const express = require('express');
const router  = express.Router();
const pool    = require('../db');

const BASE_URL = 'https://e-vendstudio.ca';

// Date au format AAAA-MM-JJ, ou null (dans ce cas <lastmod> est omis :
// mieux vaut ne rien dire que mentir à Google avec la date du jour)
function formatDate(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

function echapperXml(txt) {
  return String(txt)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function urlEntry(loc, lastmod, changefreq = 'weekly', priority = '0.5') {
  const lm = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
  return `
  <url>
    <loc>${BASE_URL}${echapperXml(encodeURI(loc))}</loc>${lm}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

router.get('/', async (req, res) => {
  try {
    const urls = [];

    // 1. Pages statiques (ajouter ici Templates / Fonctionnalités si ce sont de vraies pages publiques)
    const pagesStatiques = [
      { loc: '/',          changefreq: 'daily',   priority: '1.0' },
      { loc: '/blog',      changefreq: 'weekly',  priority: '0.7' },
      { loc: '/faq',       changefreq: 'monthly', priority: '0.6' },
      { loc: '/documents', changefreq: 'weekly',  priority: '0.7' },
    ];
    for (const p of pagesStatiques) urls.push(urlEntry(p.loc, null, p.changefreq, p.priority));

    // 2. Documents (/documents/:slug)
    try {
      const r = await pool.query(`SELECT slug, updated_at FROM pages_plateforme WHERE actif = true ORDER BY id`);
      for (const d of r.rows) urls.push(urlEntry(`/documents/${d.slug}`, formatDate(d.updated_at), 'monthly', '0.7'));
    } catch (e) {
      console.warn('⚠️ Sitemap — documents ignorés:', e.message);
    }

    // 3. Politiques (/politiques/:slug)
    try {
      const r = await pool.query(`SELECT slug FROM politiques_plateforme WHERE actif = true ORDER BY id`);
      for (const p of r.rows) urls.push(urlEntry(`/politiques/${p.slug}`, null, 'monthly', '0.5'));
    } catch (e) {
      console.warn('⚠️ Sitemap — politiques ignorées:', e.message);
    }

    // 4. Articles de blog publiés et visibles
    try {
      const r = await pool.query(
        `SELECT id, slug, updated_at, created_at FROM blog_admin
          WHERE statut = 'publie' AND visible = true ORDER BY id`
      );
      for (const a of r.rows) {
        urls.push(urlEntry(a.slug ? `/blog/${a.slug}` : `/blog/${a.id}`, formatDate(a.updated_at || a.created_at), 'monthly', '0.6'));
      }
    } catch (e) {
      console.warn('⚠️ Sitemap — blog ignoré:', e.message);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(xml);
  } catch (err) {
    console.error('❌ GET /sitemap.xml :', err);
    res.status(500).send('<?xml version="1.0"?><error>Erreur génération sitemap</error>');
  }
});

module.exports = router;