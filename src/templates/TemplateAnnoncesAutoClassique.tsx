// src/templates/TemplateAnnoncesAutoClassique.tsx
// e-Vend Studio — Petites annonces « Auto Classique » (voitures, VUS, motos, VR, bateaux) — affichage seulement.
// Les annonces viennent de « Mes annonces » (API /api/annonces-studio). L'apparence vient de config.annonces.

import SiteClassique, { type ProfilAnnonces } from './annoncesSite/SiteClassique';
import { nbDe, type AnnoncePub } from './annoncesSite/moteur';

const il = (j: number) => new Date(Date.now() - j * 86400000).toISOString();
const v = (id: number, titre: string, description: string, photo: string, prix: number, categorie: string, lieu: string, jours: number, details: Record<string, string>, vedette = false): AnnoncePub => ({
  id, titre, description, prix, prixTexte: '', categorie, lieu, photos: [photo], details, vedette, statut: 'active', datePublication: il(jours), dateExpiration: null,
});
const P = (n: number) => `https://images.pexels.com/photos/${n}/pexels-photo-${n}.jpeg?auto=compress&cs=tinysrgb&w=800`;

const DEMO: AnnoncePub[] = [
  v(1, 'Honda Civic Sport 2019 — très propre', 'Un seul propriétaire, entretien complet chez le concessionnaire, pneus d\'hiver inclus. Aucun accident.', P(170811), 18900, 'Voiture', 'Québec', 1, { Marque: 'Honda', Modèle: 'Civic Sport', Année: '2019', Kilométrage: '85 000 km', Transmission: 'Automatique', Carburant: 'Essence', Carrosserie: 'Berline', Couleur: 'Gris' }, true),
  v(2, 'Toyota RAV4 XLE 2021 — traction intégrale', 'Toit ouvrant, caméra de recul, sièges chauffants. Garantie prolongée transférable.', P(358070), 31500, 'VUS / Camionnette', 'Lévis', 2, { Marque: 'Toyota', Modèle: 'RAV4 XLE', Année: '2021', Kilométrage: '42 000 km', Transmission: 'Automatique', Carburant: 'Hybride' }),
  v(3, 'Ford Mustang GT 2016', 'V8 5,0 L, boîte manuelle, échappement sport. Pour passionnés.', P(116675), 29900, 'Voiture', 'Montréal', 4, { Marque: 'Ford', Modèle: 'Mustang GT', Année: '2016', Kilométrage: '68 000 km', Transmission: 'Manuelle', Carburant: 'Essence' }),
  v(4, 'Toyota Corolla 2015 — économique', 'Idéale première voiture. Consommation minimale, entretien à jour.', P(112460), 9500, 'Voiture', 'Trois-Rivières', 6, { Marque: 'Toyota', Modèle: 'Corolla', Année: '2015', Kilométrage: '160 000 km', Transmission: 'Automatique', Carburant: 'Essence' }),
  v(5, 'Mercedes-Benz Classe C 2018', 'Intérieur cuir, navigation, aides à la conduite. Historique disponible.', P(210019), 26400, 'Voiture', 'Sherbrooke', 8, { Marque: 'Mercedes-Benz', Modèle: 'C300', Année: '2018', Kilométrage: '91 000 km', Transmission: 'Automatique', Carburant: 'Essence' }),
  v(6, 'Mazda 3 GT 2017', 'Écran tactile, sièges chauffants, démarreur à distance.', P(1335077), 14200, 'Voiture', 'Québec', 11, { Marque: 'Mazda', Modèle: '3 GT', Année: '2017', Kilométrage: '112 000 km', Transmission: 'Manuelle', Carburant: 'Essence' }),
];

const km = (a: AnnoncePub) => { const n = nbDe(a.details['Kilométrage']); return Number.isFinite(n) ? `${n.toLocaleString('fr-CA')} km` : ''; };

export const PROFIL_AUTO: ProfilAnnonces = {
  icone: '🚗',
  recherche: 'Marque, modèle…',
  lieuPlaceholder: 'Ville ou région',
  defaut: { nomSite: 'Auto Annonces', slogan: 'Trouvez votre prochain véhicule', logoUrl: '', couleurPrincipale: '#1e40af', couleurFond: '#f4f6fa', police: 'moderne', apropos: '', email: '', telephone: '' },
  demo: DEMO,
  selects: [{ cle: 'Marque', label: 'Marque' }, { cle: 'Carrosserie', label: 'Carrosserie' }, { cle: 'Carburant', label: 'Carburant' }, { cle: 'Transmission', label: 'Transmission' }],
  plages: [{ cle: 'Année', label: 'Année' }, { cle: 'Kilométrage', label: 'Kilométrage', unite: 'km', min: false }],
  puces: (a) => [a.details['Année'], km(a), a.details['Transmission']].filter(Boolean) as string[],
  avis: "Les annonces sont affichées à titre informatif. Aucune transaction n'est effectuée sur ce site : les échanges se font directement avec l'annonceur. Vérifiez le véhicule (historique, inspection) avant tout paiement.",
};

interface Props { config?: Record<string, any>; siteId?: number; vendeurId?: number; }
export default function TemplateAnnoncesAutoClassique(props: Props) { return <SiteClassique profil={PROFIL_AUTO} {...props} />; }