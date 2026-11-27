// src/templates/TemplateAnnoncesImmoClassique.tsx
// e-Vend Studio — Petites annonces « Immobilier Classique » (maisons, condos, appartements, terrains, commercial) — affichage seulement.
// Les annonces viennent de « Mes annonces » (API /api/annonces-studio). L'apparence vient de config.annonces.

import SiteClassique, { type ProfilAnnonces, type ConfigAnnoncesClassique } from './annoncesSite/SiteClassique';
import { nbDe, type AnnoncePub } from './annoncesSite/moteur';

const il = (j: number) => new Date(Date.now() - j * 86400000).toISOString();
const v = (id: number, titre: string, description: string, photo: string, prix: number, categorie: string, lieu: string, jours: number, details: Record<string, string>, vedette = false): AnnoncePub => ({
  id, titre, description, prix, prixTexte: '', categorie, lieu, photos: [photo], details, vedette, statut: 'active', datePublication: il(jours), dateExpiration: null,
});
const P = (n: number) => `https://images.pexels.com/photos/${n}/pexels-photo-${n}.jpeg?auto=compress&cs=tinysrgb&w=800`;

const DEMO: AnnoncePub[] = [
  v(1, 'Maison de ville rénovée — secteur recherché', 'Cuisine ouverte, grande cour clôturée, garage. À distance de marche des écoles et des commerces.', P(106399), 449000, 'Maison', 'Québec', 1, { Transaction: 'À vendre', 'Type de bien': 'Maison', Chambres: '3', 'Salles de bain': '2', Superficie: '1 650 pi²', 'Année de construction': '1998' }, true),
  v(2, 'Condo lumineux avec balcon', 'Aire ouverte, plancher de bois, stationnement intérieur inclus. Près du transport en commun.', P(1396122), 289000, 'Condo', 'Lévis', 2, { Transaction: 'À vendre', 'Type de bien': 'Condo', Chambres: '2', 'Salles de bain': '1', Superficie: '940 pi²', 'Année de construction': '2012' }),
  v(3, '4 ½ à louer — chauffé, éclairé', 'Libre immédiatement. Entrée laveuse-sécheuse, animaux acceptés sur demande.', P(1396132), 1350, 'Appartement', 'Montréal', 3, { Transaction: 'À louer', 'Type de bien': 'Appartement', Chambres: '2', 'Salles de bain': '1', Superficie: '850 pi²' }),
  v(4, 'Bungalow avec grand terrain boisé', 'Sous-sol aménagé, thermopompe, remise. Calme et privé.', P(186077), 379000, 'Maison', 'Sherbrooke', 5, { Transaction: 'À vendre', 'Type de bien': 'Maison', Chambres: '4', 'Salles de bain': '2', Superficie: '1 400 pi²', 'Année de construction': '1985' }),
  v(5, 'Maison moderne 5 chambres', 'Grand îlot, foyer au gaz, cour avec piscine creusée.', P(280229), 699000, 'Maison', 'Québec', 7, { Transaction: 'À vendre', 'Type de bien': 'Maison', Chambres: '5', 'Salles de bain': '3', Superficie: '2 600 pi²', 'Année de construction': '2018' }),
  v(6, '3 ½ meublé à louer', 'Idéal pour étudiant ou professionnel. Internet inclus.', P(259588), 995, 'Appartement', 'Trois-Rivières', 10, { Transaction: 'À louer', 'Type de bien': 'Appartement', Chambres: '1', 'Salles de bain': '1', Superficie: '520 pi²' }),
];

const sup = (a: AnnoncePub) => { const n = nbDe(a.details['Superficie']); return Number.isFinite(n) ? `${n.toLocaleString('fr-CA')} pi²` : ''; };

export const PROFIL_IMMO: ProfilAnnonces = {
  icone: '🏡',
  recherche: 'Ville, quartier, type de propriété…',
  lieuPlaceholder: 'Ville ou région',
  defaut: { nomSite: 'Immo Annonces', slogan: 'Trouvez la propriété qui vous ressemble', logoUrl: '', couleurPrincipale: '#92400e', couleurFond: '#fbf8f3', police: 'classique', apropos: '', email: '', telephone: '' },
  demo: DEMO,
  selects: [{ cle: 'Transaction', label: 'Transaction' }, { cle: 'Type de bien', label: 'Type de bien' }],
  plages: [{ cle: 'Chambres', label: 'Chambres', max: false }, { cle: 'Salles de bain', label: 'Salles de bain', max: false }, { cle: 'Superficie', label: 'Superficie', unite: 'pi²' }],
  puces: (a) => [a.details['Chambres'] ? `${a.details['Chambres']} ch.` : '', a.details['Salles de bain'] ? `${a.details['Salles de bain']} sdb` : '', sup(a)].filter(Boolean) as string[],
  suffixePrix: (a) => (a.details['Transaction'] === 'À louer' ? '/ mois' : ''),
  avis: "Les annonces sont affichées à titre informatif. Aucune transaction n'est effectuée sur ce site : les échanges se font directement avec l'annonceur. Vérifiez les renseignements (titre de propriété, bail, inspection) avant toute entente.",
};

interface Props { config?: Partial<ConfigAnnoncesClassique>; siteId?: number; vendeurId?: number; }
export default function TemplateAnnoncesImmoClassique(props: Props) { return <SiteClassique profil={PROFIL_IMMO} {...props} />; }