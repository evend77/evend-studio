// routes/chatbot_public.js
// e-Vend Studio — Add-on Chatbot (sans IA)
// API publique appelée par le widget (ChatbotWidget.tsx) sur le site public
// d'un gestionnaire. Chaque appel exige gestionnaire_id — jamais de recherche
// ou de réponse qui traverse les données d'un autre gestionnaire.

const express = require('express');
const router  = express.Router();
const db      = require('../db');

// ═══════════════════════════════════════════════════════════════════════
//  FONCTIONS DE VÉRIFICATION — toutes scopées par gestionnaire_id
// ═══════════════════════════════════════════════════════════════════════

function normaliser(txt = '') {
  return txt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

async function checkBlacklist(question, gestionnaireId) {
  const questionLower = normaliser(question);
  const { rows } = await db.query(
    `SELECT mots_cles, message_reponse FROM chatbot_blacklist WHERE gestionnaire_id = $1 AND actif = true`,
    [gestionnaireId]
  );
  for (const item of rows) {
    for (const mot of item.mots_cles) {
      if (questionLower.includes(normaliser(mot))) {
        return { blocked: true, message: item.message_reponse };
      }
    }
  }
  return { blocked: false };
}

async function checkReponseDirecte(question, gestionnaireId) {
  const questionLower = normaliser(question);
  const { rows } = await db.query(
    `SELECT id, mots_cles, reponse, reponses, menu_choix
     FROM chatbot_reponses_directes
     WHERE gestionnaire_id = $1 AND actif = true
     ORDER BY ordre ASC`,
    [gestionnaireId]
  );
  for (const item of rows) {
    for (const mot of item.mots_cles) {
      if (questionLower.includes(normaliser(mot))) {
        if (item.menu_choix) {
          return { found: true, reponse: '', menu_choix: item.menu_choix };
        }
        const variantes = Array.isArray(item.reponses) && item.reponses.filter(r => r && r.trim()).length > 0
          ? item.reponses.filter(r => r && r.trim())
          : null;
        const reponse = variantes ? variantes[Math.floor(Math.random() * variantes.length)] : item.reponse;
        return { found: true, reponse };
      }
    }
  }
  return { found: false };
}

async function checkSourcePersonnalisee(question, gestionnaireId) {
  const questionLower = normaliser(question);
  const { rows } = await db.query(
    `SELECT id, mots_cles, url_source, titre, description
     FROM chatbot_sources_personnalisees
     WHERE gestionnaire_id = $1 AND actif = true
     ORDER BY ordre ASC`,
    [gestionnaireId]
  );
  for (const source of rows) {
    if (!source.mots_cles || source.mots_cles.length === 0) continue;
    for (const mot of source.mots_cles) {
      if (!mot || mot.trim() === '') continue;
      if (questionLower.includes(normaliser(mot))) {
        return {
          found: true,
          source: {
            id: source.id, url: source.url_source,
            titre: source.titre || 'Source spécifique',
            description: source.description,
          },
        };
      }
    }
  }
  return { found: false };
}

// ═══════════════════════════════════════════════════════════════════════
//  EXTRACTION DE SECTIONS PAR TITRES (h1-h4) — logique pure, réutilisée
//  telle quelle (aucune référence marketplace, fonctionne sur n'importe
//  quel contenu HTML riche : pages_gestionnaire, blog_articles_gestionnaire)
// ═══════════════════════════════════════════════════════════════════════
function extraireSectionsParTitres(contenuHtml, motsCles, maxSources = 3) {
  if (!contenuHtml) return [];

  let htmlNettoye = contenuHtml
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');

  const sections = [];
  const regexTitres = /<(h[1-4])[^>]*>(.*?)<\/\1>/gi;
  let dernierMatch = null;
  let match;

  while ((match = regexTitres.exec(htmlNettoye)) !== null) {
    const niveau = match[1];
    const titre = match[2].replace(/<[^>]*>/g, '').trim();
    const debutSection = match.index + match[0].length;

    if (dernierMatch) {
      let contenuSection = htmlNettoye.substring(dernierMatch.positionFin, match.index);
      contenuSection = contenuSection.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      contenuSection = contenuSection.replace(/^[^\w\u00C0-\u00FF]*/, '');
      if (contenuSection.length > 30) {
        sections.push({ niveau: dernierMatch.niveau, titre: dernierMatch.titre, contenu: contenuSection.substring(0, 500) });
      }
    }
    dernierMatch = { niveau, titre, position: match.index, positionFin: debutSection };
  }

  if (dernierMatch) {
    let contenuSection = htmlNettoye.substring(dernierMatch.positionFin);
    contenuSection = contenuSection.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    contenuSection = contenuSection.replace(/^[^\w\u00C0-\u00FF]*/, '');
    if (contenuSection.length > 30) {
      sections.push({ niveau: dernierMatch.niveau, titre: dernierMatch.titre, contenu: contenuSection.substring(0, 500) });
    }
  }

  if (sections.length === 0) {
    const paragraphes = htmlNettoye.split(/<\/p>/i);
    for (const p of paragraphes) {
      let texte = p.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (texte.length > 50) {
        sections.push({ niveau: 'p', titre: 'Extrait', contenu: texte.substring(0, 500) });
      }
    }
  }

  const sectionsPertinentes = [];
  for (const section of sections) {
    let score = 0;
    const texteComplet = (section.titre + ' ' + section.contenu).toLowerCase();
    for (const mot of motsCles) {
      const motLower = mot.toLowerCase();
      const occurrences = (texteComplet.match(new RegExp(motLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      score += occurrences;
      if (section.titre.toLowerCase().includes(motLower)) score += 3;
    }
    if (score > 0) sectionsPertinentes.push({ ...section, score });
  }

  sectionsPertinentes.sort((a, b) => b.score - a.score);
  return sectionsPertinentes.slice(0, maxSources);
}

// ═══════════════════════════════════════════════════════════════════════
//  ROUTES
// ═══════════════════════════════════════════════════════════════════════

// GET /api/chatbot-public/config/:gestionnaireId — config publique du widget
router.get('/config/:gestionnaireId', async (req, res) => {
  try {
    const gestionnaireId = parseInt(req.params.gestionnaireId);
    if (!gestionnaireId) return res.status(400).json({ error: 'gestionnaireId requis' });

    const { rows } = await db.query(
      `SELECT
        actif, accueil_phrases, transition_phrases, attente_phrases,
        erreur_phrases, fin_phrases, suggestions_defaut,
        bouton_couleur, bouton_couleur_survol, bulle_couleur,
        bulle_entete_couleur, texte_couleur, texte_entete_couleur, accroche_couleur,
        largeur_widget, hauteur_widget, largeur_min, hauteur_min,
        bouton_taille, bouton_icone_taille,
        position_widget, marge_bas, marge_droite, marge_gauche, marge_haut,
        border_radius_widget, border_radius_bouton, ombre_widget,
        police_texte, taille_texte,
        logo_url, logo_taille, icone_bouton,
        delai_reponse, animation_duree,
        suggerer_questions, afficher_bulle_bienvenue, delai_bulle_bienvenue,
        max_caracteres_question
       FROM chatbot_config_gestionnaire
       WHERE gestionnaire_id = $1 AND actif = true`,
      [gestionnaireId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Chatbot désactivé ou non configuré' });
    }
    res.json({ config: rows[0] });
  } catch (err) {
    console.error('GET /chatbot-public/config:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/chatbot-public/ask
router.post('/ask', async (req, res) => {
  const { gestionnaire_id, question, session_id } = req.body;

  if (!gestionnaire_id) {
    return res.status(400).json({ reponse: null, error: 'gestionnaire_id requis' });
  }
  if (!question || question.trim().length < 3) {
    return res.json({ reponse: null, error: "Posez-moi une question sur ce site." });
  }
  if (question.length > 500) {
    return res.json({ reponse: null, error: 'Votre question est trop longue (max 500 caractères).' });
  }

  try {
    const configCheck = await db.query(
      `SELECT actif, sources_contenu, score_minimum, max_resultats,
              transition_phrases, erreur_phrases, fin_phrases, suggestions_defaut
       FROM chatbot_config_gestionnaire WHERE gestionnaire_id = $1`,
      [gestionnaire_id]
    );
    if (!configCheck.rows[0]?.actif) {
      return res.json({ reponse: null, error: 'Le chatbot est temporairement désactivé' });
    }
    const cfg = configCheck.rows[0];

    // 1. Liste noire
    const blacklistCheck = await checkBlacklist(question, gestionnaire_id);
    if (blacklistCheck.blocked) {
      await db.query(
        `INSERT INTO chatbot_conversations (gestionnaire_id, session_id, question, reponse, score, ip, user_agent)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [gestionnaire_id, session_id || null, question, blacklistCheck.message, 0, req.ip, req.headers['user-agent']]
      );
      return res.json({ reponse: blacklistCheck.message, found: true, blacklist: true });
    }

    // 2. Réponses rapides
    const reponseDirecte = await checkReponseDirecte(question, gestionnaire_id);
    if (reponseDirecte.found) {
      await db.query(
        `INSERT INTO chatbot_conversations (gestionnaire_id, session_id, question, reponse, score, ip, user_agent)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [gestionnaire_id, session_id || null, question, reponseDirecte.reponse, 1, req.ip, req.headers['user-agent']]
      );
      return res.json({ reponse: reponseDirecte.reponse, menu_choix: reponseDirecte.menu_choix || null, found: true, direct: true });
    }

    // 3. Sources personnalisées
    const sourcePerso = await checkSourcePersonnalisee(question, gestionnaire_id);
    if (sourcePerso.found) {
      const reponse = `📚 **${sourcePerso.source.titre}**\n\n${sourcePerso.source.description || 'Voici la source qui correspond à votre recherche :'}\n\n🔗 [Cliquez ici](${sourcePerso.source.url})`;
      await db.query(
        `INSERT INTO chatbot_conversations (gestionnaire_id, session_id, question, reponse, score, ip, user_agent)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [gestionnaire_id, session_id || null, question, reponse, 0.9, req.ip, req.headers['user-agent']]
      );
      return res.json({
        reponse,
        page: { titre: sourcePerso.source.titre, lien: sourcePerso.source.url, type: 'personnalisee' },
        found: true, source_personnalisee: true,
      });
    }

    // 4. Recherche automatique dans le contenu du gestionnaire
    const scoreMinimum = parseFloat(cfg.score_minimum) || 0.05;
    const maxResultats  = parseInt(cfg.max_resultats) || 5;
    const sourcesContenu = cfg.sources_contenu || { pages: true, produits: true, blog: true };

    const motsStop = ['comment', 'pour', 'une', 'dans', 'avec', 'sans', 'sur', 'les', 'des', 'est', 'un', 'que', 'qui', 'dont', 'faire', 'peut', 'être', 'quoi', 'quand', 'ou', 'où', 'pourquoi'];
    let motsRecherche = question.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .split(' ').filter(m => m.length > 2 && !motsStop.includes(m));
    if (motsRecherche.length === 0) {
      motsRecherche = question.toLowerCase().split(' ').filter(m => m.length > 2);
    }

    const toutesSections = [];

    // -- pages_gestionnaire + blog_articles_gestionnaire : contenu riche, extraction par titres --
    if (motsRecherche.length > 0) {
      const condPages = motsRecherche.map((_, i) => `(titre ILIKE $${i + 2} OR contenu ILIKE $${i + 2})`).join(' OR ');
      const paramsMots = motsRecherche.map(m => `%${m}%`);

      if (sourcesContenu.pages !== false) {
        const { rows: pages } = await db.query(
          `SELECT slug, titre, contenu, 'page' as type, '/pages/' || slug as lien
           FROM pages_gestionnaire
           WHERE gestionnaire_id = $1 AND actif = true AND contenu IS NOT NULL AND contenu != '' AND (${condPages})`,
          [gestionnaire_id, ...paramsMots]
        );
        for (const page of pages) {
          for (const section of extraireSectionsParTitres(page.contenu, motsRecherche, 2)) {
            toutesSections.push({ ...section, pageTitre: page.titre, pageLien: page.lien, pageType: page.type });
          }
        }
      }

      if (sourcesContenu.blog !== false) {
        const { rows: articles } = await db.query(
          `SELECT slug, titre, contenu, 'blog' as type, '/blog/' || slug as lien
           FROM blog_articles_gestionnaire
           WHERE gestionnaire_id = $1 AND est_publie = true AND contenu IS NOT NULL AND contenu != '' AND (${condPages})`,
          [gestionnaire_id, ...paramsMots]
        );
        for (const article of articles) {
          for (const section of extraireSectionsParTitres(article.contenu, motsRecherche, 2)) {
            toutesSections.push({ ...section, pageTitre: article.titre, pageLien: article.lien, pageType: article.type });
          }
        }
      }

      // -- produits : pas de contenu structuré par titres, une section = un produit --
      if (sourcesContenu.produits !== false) {
        const condProduits = motsRecherche.map((_, i) => `(titre ILIKE $${i + 2} OR description ILIKE $${i + 2})`).join(' OR ');
        const { rows: produits } = await db.query(
          `SELECT id, titre, description, prix, prix_promo
           FROM produits
           WHERE gestionnaire_id = $1 AND statut = 'actif' AND (${condProduits})
           LIMIT ${maxResultats}`,
          [gestionnaire_id, ...paramsMots]
        );
        for (const p of produits) {
          const prixAffiche = p.prix_promo ? `${p.prix_promo}$ (rabais)` : `${p.prix}$`;
          let score = 0;
          const texte = `${p.titre} ${p.description || ''}`.toLowerCase();
          for (const mot of motsRecherche) {
            if (p.titre.toLowerCase().includes(mot)) score += 3;
            if (texte.includes(mot)) score += 1;
          }
          if (score > 0) {
            toutesSections.push({
              niveau: 'produit', titre: p.titre,
              contenu: `${(p.description || '').substring(0, 300)} — Prix : ${prixAffiche}`,
              score, pageTitre: p.titre, pageLien: `/produit/${p.id}`, pageType: 'produit',
            });
          }
        }
      }
    }

    toutesSections.sort((a, b) => (b.score || 0) - (a.score || 0));
    const sectionsFinales = toutesSections.slice(0, maxResultats).filter(s => (s.score || 0) >= scoreMinimum * 100 || s.pageType === 'produit');
    // Note: score des sections texte = nb d'occurrences (entier), score_minimum de la config
    // est pensé pour un rank 0-1 (héritage marketplace) — on le traite ici comme un seuil
    // "au moins une occurrence pertinente" plutôt qu'une proportion, plus adapté au nouveau calcul.

    const transitionPhrases = cfg.transition_phrases?.length ? cfg.transition_phrases : ['📚 Voici ce que j\'ai trouvé :'];
    const erreurPhrases     = cfg.erreur_phrases?.length ? cfg.erreur_phrases : ['😕 Je n\'ai pas trouvé de réponse.'];
    const finPhrases        = cfg.fin_phrases?.length ? cfg.fin_phrases : ['💡 Autre question ?'];
    const suggestionsDefaut = cfg.suggestions_defaut?.length ? cfg.suggestions_defaut : [];

    if (sectionsFinales.length === 0) {
      const randomErreur = erreurPhrases[Math.floor(Math.random() * erreurPhrases.length)];
      await db.query(
        `INSERT INTO chatbot_conversations (gestionnaire_id, session_id, question, reponse, score, ip, user_agent)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [gestionnaire_id, session_id || null, question, null, 0, req.ip, req.headers['user-agent']]
      );
      const suggestionsTexte = suggestionsDefaut.length ? `\n\n💡 Suggestions :\n${suggestionsDefaut.map(s => `• ${s}`).join('\n')}` : '';
      return res.json({ reponse: `${randomErreur}${suggestionsTexte}`, suggestions: suggestionsDefaut, found: false });
    }

    const randomTransition = transitionPhrases[Math.floor(Math.random() * transitionPhrases.length)];
    const randomFin = finPhrases[Math.floor(Math.random() * finPhrases.length)];

    let reponseFinale = `${randomTransition}\n\n`;
    sectionsFinales.forEach((section, i) => {
      const emoji = section.pageType === 'produit' ? '🛍️' : section.niveau === 'h1' ? '📌' : section.niveau === 'h2' ? '📖' : '📄';
      reponseFinale += `${emoji} **${section.titre}**\n${section.contenu}\n🔗 [Voir "${section.pageTitre}"](${section.pageLien})\n\n`;
      if (i < sectionsFinales.length - 1) reponseFinale += `---\n\n`;
    });
    reponseFinale += randomFin;

    await db.query(
      `INSERT INTO chatbot_conversations (gestionnaire_id, session_id, question, reponse, score, ip, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [gestionnaire_id, session_id || null, question, reponseFinale, sectionsFinales[0]?.score || 0, req.ip, req.headers['user-agent']]
    );

    res.json({
      reponse: reponseFinale,
      pages: sectionsFinales.map(s => ({ titre: s.titre, pageTitre: s.pageTitre, lien: s.pageLien, type: s.pageType, score: s.score })),
      found: true,
      multiple_sources: sectionsFinales.length > 1,
    });
  } catch (err) {
    console.error('POST /chatbot-public/ask:', err);
    res.status(500).json({ reponse: null, error: 'Une erreur est survenue. Veuillez réessayer plus tard.' });
  }
});

module.exports = router;