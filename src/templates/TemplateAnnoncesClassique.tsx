// src/templates/TemplateAnnoncesClassique.tsx
// e-Vend Studio — Petites annonces « Classique » (généraliste) — affichage seulement, aucune transaction.
// Les annonces viennent de « Mes annonces » (API /api/annonces-studio). L'apparence (sections, textes, photos, couleurs)
// vient de config.annonces et se règle dans Mes annonces → Apparence. Même gabarit que Auto et Immobilier Classique.

import SiteClassique, { type ProfilAnnonces } from './annoncesSite/SiteClassique';
import type { AnnoncePub } from './annoncesSite/moteur';

const il = (j: number) => new Date(Date.now() - j * 86400000).toISOString();
const demo = (id: number, titre: string, description: string, photo: string, prix: number | null, categorie: string, lieu: string, jours: number, vedette = false, details: Record<string, string> = {}): AnnoncePub => ({
  id, titre, description, prix, prixTexte: prix == null ? 'À discuter' : '', categorie, lieu, photos: [photo], details, vedette, statut: 'active', datePublication: il(jours), dateExpiration: null,
});
const ANNONCES_DEMO: AnnoncePub[] = [
  demo(1, 'Vélo de montagne Trek — excellent état', 'Vélo entretenu chaque saison, freins à disque, suspension avant. Idéal pour sentiers et balades. Casque inclus.', 'https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=800', 450, 'Sports & loisirs', 'Québec', 1, true, { Marque: 'Trek', Année: '2021', Taille: 'M' }),
  demo(2, 'Table de salle à manger en chêne massif', 'Table de 6 à 8 places, quelques marques d\'usage. Livraison possible dans la région.', 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800', 380, 'Maison & jardin', 'Lévis', 2, false, { Matériau: 'Chêne', Dimensions: '180 × 90 cm' }),
  demo(3, 'Guitare acoustique Yamaha avec étui', 'Très bonne sonorité, cordes neuves. Parfaite pour débuter ou jouer au feu de camp.', 'https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&w=800', 220, 'Musique', 'Montréal', 3),
  demo(4, 'Poussette 3 en 1 — très propre', 'Utilisée un an. Nacelle, siège et coque auto inclus. Fonctionne parfaitement.', 'https://images.pexels.com/photos/3933275/pexels-photo-3933275.jpeg?auto=compress&cs=tinysrgb&w=800', 175, 'Bébé & enfants', 'Trois-Rivières', 5),
  demo(5, 'Service de déneigement de cour — saison complète', 'Équipe locale, ponctuelle. Soumission gratuite, contrat à la saison.', 'https://images.pexels.com/photos/259915/pexels-photo-259915.jpeg?auto=compress&cs=tinysrgb&w=800', null, 'Services', 'Québec', 6),
  demo(6, 'Lot de livres de cuisine (12)', 'Collection variée, état neuf à bon. Vendus ensemble seulement.', 'https://images.pexels.com/photos/1005638/pexels-photo-1005638.jpeg?auto=compress&cs=tinysrgb&w=800', 40, 'Livres', 'Sherbrooke', 9),
];

export const PROFIL_GENERAL: ProfilAnnonces = {
  icone: '📋',
  recherche: 'Que cherchez-vous ?',
  lieuPlaceholder: 'Ville ou région',
  defaut: { nomSite: 'Petites annonces', slogan: 'Trouvez de bonnes affaires près de chez vous', logoUrl: '', couleurPrincipale: '#0f766e', couleurFond: '#faf7f2', police: 'classique', apropos: '', email: '', telephone: '' },
  demo: ANNONCES_DEMO,
  selects: [],
  plages: [],
  puces: () => [],
  avis: "Les annonces sont affichées à titre informatif. Aucune transaction n'est effectuée sur ce site : les échanges se font directement avec l'annonceur. Soyez prudent et vérifiez l'article avant de payer.",
};

interface Props { config?: Record<string, any>; siteId?: number; vendeurId?: number; }
export default function TemplateAnnoncesClassique(props: Props) { return <SiteClassique profil={PROFIL_GENERAL} {...props} />; }