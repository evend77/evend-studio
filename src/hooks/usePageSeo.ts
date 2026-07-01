// hooks/usePageSeo.ts
// Met à jour dynamiquement toutes les balises SEO selon la page active
// À appeler dans chaque page avec ses propres valeurs
//
// Usage:
//   usePageSeo({
//     titre:       'Électronique — Acheter au Canada | e-Vend.ca',
//     description: 'Achetez de l\'électronique de vendeurs canadiens...',
//     url:         'https://e-vend.ca/catalogue/electronique',
//   });

import { useEffect } from 'react';

const TITRE_DEFAUT      = 'e-Vend.ca | Acheter et vendre localement au Canada';
const DESCRIPTION_DEFAUT = 'e-Vend est une marketplace canadienne et québécoise pour acheter et vendre localement des produits uniques, facilement et en toute sécurité.';
const URL_DEFAUT        = 'https://e-vend.ca';
const IMAGE_DEFAUT      = 'https://evend-ca-storage-2026.s3.us-east-1.amazonaws.com/seo/og-image-6b0c576e-21dd-448a-bda0-2a2621034a4d.jpg';

interface PageSeoOptions {
  titre?:       string;
  description?: string;
  url?:         string;
  image?:       string;
}

function setMeta(selector: string, content: string) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function usePageSeo({ titre, description, url, image }: PageSeoOptions = {}) {
  useEffect(() => {
    const t = titre       || TITRE_DEFAUT;
    const d = description || DESCRIPTION_DEFAUT;
    const u = url         || URL_DEFAUT;
    const i = image       || IMAGE_DEFAUT;

    // Titre
    document.title = t;
    setMeta('meta[property="og:title"]',      t);
    setMeta('meta[name="twitter:title"]',     t);

    // Description
    setMeta('meta[name="description"]',         d);
    setMeta('meta[property="og:description"]',  d);
    setMeta('meta[name="twitter:description"]', d);

    // URL canonique + og:url
    setMeta('meta[property="og:url"]', u);
    setLink('canonical', u);

    // Image
    setMeta('meta[property="og:image"]',  i);
    setMeta('meta[name="twitter:image"]', i);

    // Restaurer les valeurs par défaut quand on quitte la page
    return () => {
      document.title = TITRE_DEFAUT;
      setMeta('meta[name="description"]',         DESCRIPTION_DEFAUT);
      setMeta('meta[property="og:description"]',  DESCRIPTION_DEFAUT);
      setMeta('meta[name="twitter:description"]', DESCRIPTION_DEFAUT);
      setMeta('meta[property="og:title"]',        TITRE_DEFAUT);
      setMeta('meta[name="twitter:title"]',       TITRE_DEFAUT);
      setMeta('meta[property="og:url"]',          URL_DEFAUT);
      setLink('canonical',                        URL_DEFAUT);
      setMeta('meta[property="og:image"]',        IMAGE_DEFAUT);
      setMeta('meta[name="twitter:image"]',       IMAGE_DEFAUT);
    };
  }, [titre, description, url, image]);
}

// ── Générateur de metas pour les pages catégories ────────────────────────────
export function seoCategorie(nomGroupe: string | null, nomSousCat?: string | null, slug?: string, sousCatSlug?: string) {
  if (nomSousCat && nomGroupe) {
    return {
      titre:       `${nomSousCat} — ${nomGroupe} | e-Vend.ca`,
      description: `Achetez des ${nomSousCat.toLowerCase()} de vendeurs canadiens indépendants sur e-Vend, la marketplace québécoise. Livraison partout au Canada, paiements sécurisés.`,
      url:         `https://e-vend.ca/catalogue/${slug}/${sousCatSlug}`,
    };
  }
  if (nomGroupe) {
    return {
      titre:       `${nomGroupe} — Acheter au Canada | e-Vend.ca`,
      description: `Découvrez notre sélection de ${nomGroupe.toLowerCase()} proposée par des vendeurs canadiens indépendants sur e-Vend. Achetez local, livraison partout au Canada.`,
      url:         `https://e-vend.ca/catalogue/${slug}`,
    };
  }
  return {
    titre:       'Catalogue — Marketplace québécoise | e-Vend.ca',
    description: 'Parcourez des milliers de produits de vendeurs canadiens indépendants sur e-Vend. Électronique, vêtements, livres, meubles, bijoux et bien plus. Livraison partout au Canada.',
    url:         'https://e-vend.ca/catalogue',
  };
}