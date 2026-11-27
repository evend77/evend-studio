// src/templates/TemplateAnnoncesImmeuble.tsx
// e-Vend Studio — Petites annonces « Immeubles à revenus » (duplex, triplex, multiplex, immeubles commerciaux) — affichage seulement.
// Fiche détaillée : tableaux (caractéristiques, évaluation municipale, informations financières), rendement brut calculé
// et carte Google selon l'adresse. Les annonces viennent de « Mes annonces » ; l'apparence vient de config.annonces (même éditeur que le Classique).

import SiteClassique, { type ProfilAnnonces } from './annoncesSite/SiteClassique';
import { nbDe, type AnnoncePub } from './annoncesSite/moteur';

const il = (j: number) => new Date(Date.now() - j * 86400000).toISOString();
const v = (id: number, titre: string, description: string, photos: number[], prix: number, categorie: string, lieu: string, jours: number, details: Record<string, string>, vedette = false): AnnoncePub => ({
  id, titre, description, prix, prixTexte: '', categorie, lieu, photos: photos.map((n) => P(n)), details, vedette, statut: 'active', datePublication: il(jours), dateExpiration: null,
});
const P = (n: number) => `https://images.pexels.com/photos/${n}/pexels-photo-${n}.jpeg?auto=compress&cs=tinysrgb&w=800`;

const DEMO: AnnoncePub[] = [
  v(1, 'Triplex bien entretenu — près du métro', 'Trois logements loués, locataires fiables. Toiture refaite en 2019, entrée électrique mise à niveau. Excellent potentiel locatif.', [106399, 1396122], 685000, 'Triplex', 'Montréal', 1,
    { Adresse: '4087 rue Saint-Hubert, Montréal', 'Type de bâtiment': 'En rangée', 'Nombre de logements': '3', 'Année de construction': '1962', 'Superficie habitable': '2 450 pi²', 'Dimensions du terrain': '7,62 x 41,5 m', 'Dimensions du bâtiment': '25 x 50 pi', 'Type de vendeur': 'Propriétaire', 'Évaluation du bâtiment': '412 000 $', 'Évaluation du terrain': '215 000 $', 'Évaluation totale': '627 000 $', "Année d'évaluation": '2026', 'Revenus bruts annuels': '42 000 $', 'Taxes municipales': '4 980 $', 'Taxes scolaires': '540 $', 'Inclusions': 'Luminaires et rangements des logements.' }, true),
  v(2, 'Duplex neuf — domaine résidentiel', 'Deux logements indépendants, construction neuve, thermopompe murale incluse. Idéal pour propriétaire-occupant.', [280229, 186077], 575000, 'Duplex', 'Brownsburg-Chatham', 3,
    { Adresse: 'Rue des Bouleaux, Brownsburg-Chatham', 'Type de bâtiment': 'Isolé', 'Nombre de logements': '2', 'Année de construction': '2025', 'Superficie habitable': '1 500 pi²', 'Type de vendeur': 'Promoteur', 'Revenus bruts annuels': '26 400 $', 'Taxes municipales': '3 200 $' }),
  v(3, 'Quadruplex — fort rendement', 'Quatre logements 4 ½, stationnements, buanderie commune. Revenus stables.', [1396132, 259588], 890000, 'Quadruplex', 'Québec', 6,
    { Adresse: 'Rue Saint-Jean, Québec', 'Type de bâtiment': 'Isolé', 'Nombre de logements': '4', 'Année de construction': '1975', 'Superficie habitable': '3 600 pi²', 'Type de vendeur': 'Courtier', 'Revenus bruts annuels': '58 800 $', 'Taxes municipales': '7 150 $', 'Taxes scolaires': '710 $' }),
  v(4, 'Immeuble à revenus mixte — local commercial + 3 logements', 'Local commercial au rez-de-chaussée, trois logements à l\'étage. Emplacement achalandé.', [106399], 1250000, 'Immeuble mixte', 'Sherbrooke', 9,
    { Adresse: 'Rue King Ouest, Sherbrooke', 'Type de bâtiment': 'Jumelé', 'Nombre de logements': '4', 'Année de construction': '1950', 'Type de vendeur': 'Courtier', 'Revenus bruts annuels': '96 000 $', 'Taxes municipales': '11 400 $' }),
  v(5, 'Multiplex 6 logements — Trois-Rivières', 'Six logements tous loués. Rénovations majeures effectuées. Dossier complet disponible sur demande.', [186077, 1396122], 1490000, 'Multiplex (5 logements et +)', 'Trois-Rivières', 12,
    { Adresse: 'Rue des Forges, Trois-Rivières', 'Type de bâtiment': 'Isolé', 'Nombre de logements': '6', 'Année de construction': '1988', 'Type de vendeur': 'Propriétaire', 'Revenus bruts annuels': '90 000 $', 'Taxes municipales': '12 600 $' }),
  v(6, 'Duplex avec logement au sous-sol', 'Revenu additionnel avec le logement au sous-sol. Cour arrière clôturée.', [259588], 479000, 'Duplex', 'Lévis', 15,
    { Adresse: 'Rue Saint-Laurent, Lévis', 'Type de bâtiment': 'Isolé', 'Nombre de logements': '3', 'Année de construction': '1995', 'Revenus bruts annuels': '30 600 $', 'Taxes municipales': '4 100 $' }),
];

const $ = (n: number) => `${Math.round(n).toLocaleString('fr-CA')} $`;
const logements = (a: AnnoncePub) => nbDe(a.details['Nombre de logements']);
const revenus = (a: AnnoncePub) => nbDe(a.details['Revenus bruts annuels']);

export const PROFIL_IMMEUBLE: ProfilAnnonces = {
  icone: '🏢',
  recherche: 'Ville, quartier, type d\'immeuble…',
  lieuPlaceholder: 'Ville ou région',
  defaut: { nomSite: 'Immeubles à revenus', slogan: 'Duplex, triplex, multiplex : trouvez votre prochain placement', logoUrl: '', couleurPrincipale: '#1e3a5f', couleurFond: '#f4f6fa', police: 'classique', apropos: '', email: '', telephone: '' },
  demo: DEMO,
  selects: [{ cle: 'Type de bâtiment', label: 'Type de bâtiment' }, { cle: 'Type de vendeur', label: 'Type de vendeur' }],
  plages: [{ cle: 'Nombre de logements', label: 'Logements', max: false }, { cle: 'Revenus bruts annuels', label: 'Revenus bruts annuels', unite: '$' }],
  puces: (a) => {
    const n = logements(a), r = revenus(a);
    return [n ? `${n} logement${n > 1 ? 's' : ''}` : '', r ? `${$(r)}/an` : '', a.details['Année de construction'] ? `Construit en ${a.details['Année de construction']}` : ''].filter(Boolean) as string[];
  },
  avis: "Les annonces sont affichées à titre informatif. Aucune transaction n'est effectuée sur ce site : les échanges se font directement avec l'annonceur. Les revenus et dépenses sont fournis par l'annonceur : vérifiez-les (baux, états financiers, inspection) avant toute offre.",
  groupes: [
    { titre: 'Caractéristiques', cles: ['Adresse', 'Type de bâtiment', 'Nombre de logements', 'Année de construction', 'Superficie habitable', 'Superficie du terrain', 'Dimensions du bâtiment', 'Dimensions du terrain', 'Type de vendeur', 'Occupation'] },
    { titre: 'Évaluation municipale', cles: ['Évaluation du bâtiment', 'Évaluation du terrain', 'Évaluation totale', "Année d'évaluation"] },
    { titre: 'Informations financières', cles: ['Revenus bruts annuels', 'Taxes municipales', 'Taxes scolaires', 'Dépenses annuelles'] },
    { titre: 'Inclusions et exclusions', cles: ['Inclusions', 'Exclusions'] },
  ],
  carteCle: 'Adresse',
  calculs: (a) => {
    const r = revenus(a);
    if (!(a.prix && a.prix > 0) || !r) return [];
    const n = logements(a);
    const out = [{ label: 'Rendement brut (revenus ÷ prix)', valeur: `${(r / a.prix * 100).toFixed(1).replace('.', ',')} %` }];
    if (n) out.push({ label: 'Prix par logement', valeur: $(a.prix / n) });
    return out;
  },
};

interface Props { config?: Record<string, any>; siteId?: number; vendeurId?: number; }
export default function TemplateAnnoncesImmeuble(props: Props) { return <SiteClassique profil={PROFIL_IMMEUBLE} {...props} />; }