// CHEMIN : services/courriels_defauts.js
// e-Vend Studio — Modèles de courriel de BASE pour une boutique multivendeur.
//
// Ces textes sont copiés dans la base (table studio_modeles_courriel) la première fois que le
// gestionnaire ouvre la page « Modèles de courriel » ; il les modifie ensuite librement.
// « Réinitialiser » remet le texte de base défini ici.
//
// Syntaxe : {$variable}. Le HTML est un fragment avec styles en ligne (compatible boîtes courriel) ;
// {$couleur} et {$nom_site} sont remplacés à l'envoi par la couleur et le nom du site du gestionnaire.

'use strict';

// ── Variables disponibles dans TOUS les modèles ──────────────────────────────
const COMMUNES = [
  { cle: 'nom_site',  desc: 'Nom de votre site / boutique' },
  { cle: 'lien_site', desc: "Adresse de votre site" },
  { cle: 'date',      desc: "Date d'envoi" },
  { cle: 'annee',     desc: 'Année en cours' },
];

// ── Valeurs d'exemple (aperçu et courriel de test) ───────────────────────────
const EXEMPLES = {
  nom_site: 'Ma Boutique', lien_site: 'https://exemple.e-vendstudio.ca', date: '5 novembre 2026', annee: '2026', couleur: '#c9a96e',
  prenom: 'Marie', nom_client: 'Marie Tremblay', courriel_client: 'marie@exemple.com',
  nom_collaborateur: 'Boutique Idée Cadeaux', prenom_collaborateur: 'Alex',
  numero_commande: 'CMD-1042', montant_total: '89,99 $', liste_articles: 'Porte-clés en bois × 2<br>Tasse artisanale × 1',
  adresse_livraison: '123, rue Exemple, Québec (QC) G1A 1A1', transporteur: 'Postes Canada', numero_suivi: 'RT123456789CA', lien_suivi: 'https://exemple.com/suivi',
  lien_commande: 'https://exemple.e-vendstudio.ca/commande', lien_connexion: 'https://exemple.e-vendstudio.ca/login', lien_reinit: 'https://exemple.e-vendstudio.ca/reinit?jeton=exemple',
  lien_dashboard: 'https://exemple.e-vendstudio.ca/dashboard', lien_messagerie: 'https://exemple.e-vendstudio.ca/dashboard',
  produit: 'Porte-clés en bois', photo_produit: '', prix_depart: '10,00 $', prix_final: '45,00 $', ancienne_mise: '35,00 $', date_fin: '12 novembre 2026 à 20 h 00',
  delai_paiement: '24 heures', lien_enchere: 'https://exemple.e-vendstudio.ca/produit/1', lien_paiement: 'https://exemple.e-vendstudio.ca/panier',
  motif: 'Le produit ne correspond pas à la description.', montant_rembourse: '45,00 $',
  expediteur: 'Marie Tremblay', extrait_message: 'Bonjour, est-ce que cet article est toujours disponible ?',
  raison_signalement: 'Comportement inapproprié', nom_boutique_signalee: 'Boutique Idée Cadeaux', lien_signalements: 'https://exemple.e-vendstudio.ca/dashboard',
  nom_acheteur: 'Marie Tremblay',
};

// ── Mise en page commune (styles en ligne) ───────────────────────────────────
const enveloppe = (titre, corps) => `<div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
<div style="background:{$couleur};padding:22px 28px;border-radius:12px 12px 0 0;">
<div style="font-size:20px;font-weight:bold;color:#ffffff;">{$nom_site}</div>
<div style="font-size:12px;color:#ffffff;opacity:0.85;margin-top:4px;">${titre}</div>
</div>
<div style="background:#ffffff;padding:28px;border:1px solid #e5e7eb;border-top:none;font-size:14px;line-height:1.7;">
${corps}
</div>
<div style="background:#f9fafb;padding:16px 28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;text-align:center;font-size:11px;color:#9ca3af;line-height:1.6;">
{$nom_site} · <a href="{$lien_site}" style="color:#9ca3af;">{$lien_site}</a><br>© {$annee} {$nom_site} — Tous droits réservés
</div>
</div>`;

const p = (t) => `<p style="margin:0 0 14px 0;">${t}</p>`;
const bouton = (texte, lien) => `<p style="margin:22px 0;text-align:center;"><a href="${lien}" style="display:inline-block;background:{$couleur};color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 26px;border-radius:8px;">${texte}</a></p>`;
const encadre = (t) => `<div style="background:#f8fafc;border-left:4px solid {$couleur};padding:14px 18px;margin:16px 0;border-radius:0 8px 8px 0;">${t}</div>`;

// ── Sections (ordre d'affichage) ─────────────────────────────────────────────
const SECTIONS = [
  { cle: 'comptes',    label: 'Comptes et accès',        icone: '👤', couleur: '#1d4ed8' },
  { cle: 'commandes',  label: 'Commandes et livraison',  icone: '📦', couleur: '#15803d' },
  { cle: 'retours',    label: 'Retours et remboursements', icone: '🔄', couleur: '#b91c1c' },
  { cle: 'encheres',   label: 'Enchères',                icone: '🔨', couleur: '#7c3aed' },
  { cle: 'messages',   label: 'Messages',                icone: '💬', couleur: '#0e7490' },
  { cle: 'moderation', label: 'Modération',              icone: '🚩', couleur: '#a16207' },
];

// ── Modèles de base ──────────────────────────────────────────────────────────
// destinataire : acheteur | collaborateur | gestionnaire
// branche : true = le site envoie déjà ce courriel automatiquement ; false = modèle prêt, envoi pas encore branché.
const MODELES = [
  // ───────── Comptes ─────────
  {
    cle: 'bienvenue_acheteur', section: 'comptes', destinataire: 'acheteur', branche: false,
    nom: 'Bienvenue — nouvel acheteur', sujet: 'Bienvenue chez {$nom_site} !',
    variables: [{ cle: 'prenom', desc: "Prénom de l'acheteur" }, { cle: 'lien_connexion', desc: 'Lien de connexion' }],
    html: enveloppe('Bienvenue', p('Bonjour {$prenom},') + p('Merci de vous être inscrit(e) chez <strong>{$nom_site}</strong>. Votre compte est prêt : vous pouvez dès maintenant parcourir nos boutiques, suivre vos commandes et participer aux enchères.') + bouton('Accéder à mon compte', '{$lien_connexion}') + p('À très bientôt !')),
  },
  {
    cle: 'reinit_mot_de_passe', section: 'comptes', destinataire: 'acheteur', branche: false,
    nom: 'Réinitialisation du mot de passe', sujet: 'Réinitialisation de votre mot de passe — {$nom_site}',
    variables: [{ cle: 'prenom', desc: "Prénom du destinataire" }, { cle: 'lien_reinit', desc: 'Lien pour choisir un nouveau mot de passe' }],
    html: enveloppe('Mot de passe', p('Bonjour {$prenom},') + p('Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.') + bouton('Choisir un nouveau mot de passe', '{$lien_reinit}') + p('<span style="font-size:12px;color:#6b7280;">Si vous n\'êtes pas à l\'origine de cette demande, ignorez simplement ce courriel : votre mot de passe ne sera pas modifié.</span>')),
  },
  {
    cle: 'collaborateur_bienvenue', section: 'comptes', destinataire: 'collaborateur', branche: false,
    nom: 'Bienvenue — nouveau collaborateur', sujet: 'Bienvenue dans la communauté {$nom_site}',
    variables: [{ cle: 'prenom_collaborateur', desc: 'Prénom du collaborateur' }, { cle: 'nom_collaborateur', desc: 'Nom de sa boutique' }, { cle: 'lien_dashboard', desc: 'Lien vers son tableau de bord' }],
    html: enveloppe('Bienvenue', p('Bonjour {$prenom_collaborateur},') + p('Bienvenue chez <strong>{$nom_site}</strong> ! Votre boutique <strong>{$nom_collaborateur}</strong> est créée. Vous pouvez maintenant la personnaliser et publier vos premières annonces.') + bouton('Ouvrir mon tableau de bord', '{$lien_dashboard}')),
  },
  {
    cle: 'collaborateur_approuve', section: 'comptes', destinataire: 'collaborateur', branche: false,
    nom: 'Collaborateur approuvé', sujet: 'Votre boutique est approuvée !',
    variables: [{ cle: 'prenom_collaborateur', desc: 'Prénom du collaborateur' }, { cle: 'nom_collaborateur', desc: 'Nom de sa boutique' }, { cle: 'lien_dashboard', desc: 'Lien vers son tableau de bord' }],
    html: enveloppe('Boutique approuvée', p('Bonjour {$prenom_collaborateur},') + p('Bonne nouvelle : votre boutique <strong>{$nom_collaborateur}</strong> a été approuvée. Elle est maintenant visible sur {$nom_site}.') + bouton('Gérer ma boutique', '{$lien_dashboard}')),
  },
  {
    cle: 'collaborateur_refuse', section: 'comptes', destinataire: 'collaborateur', branche: false,
    nom: 'Collaborateur refusé', sujet: 'Votre demande chez {$nom_site}',
    variables: [{ cle: 'prenom_collaborateur', desc: 'Prénom du collaborateur' }, { cle: 'nom_collaborateur', desc: 'Nom de sa boutique' }, { cle: 'motif', desc: 'Motif indiqué par le gestionnaire' }],
    html: enveloppe('Votre demande', p('Bonjour {$prenom_collaborateur},') + p('Après examen, nous ne pouvons pas accepter la boutique <strong>{$nom_collaborateur}</strong> pour le moment.') + encadre('{$motif}') + p('Vous pouvez répondre à ce courriel si vous souhaitez en discuter.')),
  },

  // ───────── Commandes ─────────
  {
    cle: 'commande_confirmation', section: 'commandes', destinataire: 'acheteur', branche: false,
    nom: 'Confirmation de commande', sujet: 'Confirmation de votre commande {$numero_commande}',
    variables: [{ cle: 'prenom', desc: "Prénom de l'acheteur" }, { cle: 'numero_commande', desc: 'Numéro de commande' }, { cle: 'liste_articles', desc: 'Liste des articles commandés' }, { cle: 'montant_total', desc: 'Montant total payé' }, { cle: 'adresse_livraison', desc: 'Adresse de livraison' }, { cle: 'lien_commande', desc: 'Lien pour voir la commande' }],
    html: enveloppe('Confirmation de commande', p('Bonjour {$prenom},') + p('Merci pour votre achat ! Nous avons bien reçu votre paiement pour la commande <strong>{$numero_commande}</strong>.') + encadre('{$liste_articles}<br><br><strong>Total : {$montant_total}</strong>') + p('<strong>Livraison :</strong><br>{$adresse_livraison}') + bouton('Voir ma commande', '{$lien_commande}')),
  },
  {
    cle: 'commande_nouvelle_collab', section: 'commandes', destinataire: 'collaborateur', branche: false,
    nom: 'Nouvelle commande — au collaborateur', sujet: 'Nouvelle commande {$numero_commande}',
    variables: [{ cle: 'prenom_collaborateur', desc: 'Prénom du collaborateur' }, { cle: 'numero_commande', desc: 'Numéro de commande' }, { cle: 'liste_articles', desc: 'Articles commandés' }, { cle: 'montant_total', desc: 'Montant de la commande' }, { cle: 'adresse_livraison', desc: 'Adresse de livraison' }, { cle: 'lien_dashboard', desc: 'Lien vers son tableau de bord' }],
    html: enveloppe('Nouvelle commande', p('Bonjour {$prenom_collaborateur},') + p('Vous avez reçu une nouvelle commande : <strong>{$numero_commande}</strong>.') + encadre('{$liste_articles}<br><br><strong>Total : {$montant_total}</strong>') + p('<strong>À expédier à :</strong><br>{$adresse_livraison}') + bouton('Voir la commande', '{$lien_dashboard}')),
  },
  {
    cle: 'commande_expediee', section: 'commandes', destinataire: 'acheteur', branche: false,
    nom: 'Commande expédiée', sujet: 'Votre commande {$numero_commande} est en route',
    variables: [{ cle: 'prenom', desc: "Prénom de l'acheteur" }, { cle: 'numero_commande', desc: 'Numéro de commande' }, { cle: 'transporteur', desc: 'Transporteur' }, { cle: 'numero_suivi', desc: 'Numéro de suivi' }, { cle: 'lien_suivi', desc: 'Lien de suivi du colis' }],
    html: enveloppe('Commande expédiée', p('Bonjour {$prenom},') + p('Bonne nouvelle : votre commande <strong>{$numero_commande}</strong> vient d\'être expédiée.') + encadre('<strong>Transporteur :</strong> {$transporteur}<br><strong>Numéro de suivi :</strong> {$numero_suivi}') + bouton('Suivre mon colis', '{$lien_suivi}')),
  },
  {
    cle: 'commande_annulee', section: 'commandes', destinataire: 'acheteur', branche: false,
    nom: 'Commande annulée', sujet: 'Votre commande {$numero_commande} a été annulée',
    variables: [{ cle: 'prenom', desc: "Prénom de l'acheteur" }, { cle: 'numero_commande', desc: 'Numéro de commande' }, { cle: 'motif', desc: "Motif de l'annulation" }],
    html: enveloppe('Commande annulée', p('Bonjour {$prenom},') + p('Votre commande <strong>{$numero_commande}</strong> a été annulée.') + encadre('{$motif}') + p('Si un paiement a été effectué, il sera remboursé selon les délais habituels de votre institution financière.')),
  },

  // ───────── Retours ─────────
  {
    cle: 'retour_demande_collab', section: 'retours', destinataire: 'collaborateur', branche: false,
    nom: 'Demande de retour reçue — au collaborateur', sujet: 'Demande de retour — commande {$numero_commande}',
    variables: [{ cle: 'prenom_collaborateur', desc: 'Prénom du collaborateur' }, { cle: 'numero_commande', desc: 'Numéro de commande' }, { cle: 'motif', desc: "Motif donné par l'acheteur" }, { cle: 'lien_dashboard', desc: 'Lien vers son tableau de bord' }],
    html: enveloppe('Demande de retour', p('Bonjour {$prenom_collaborateur},') + p('Un acheteur demande le retour d\'un article de la commande <strong>{$numero_commande}</strong>.') + encadre('<strong>Motif :</strong><br>{$motif}') + bouton('Traiter la demande', '{$lien_dashboard}')),
  },
  {
    cle: 'retour_accepte', section: 'retours', destinataire: 'acheteur', branche: false,
    nom: 'Retour accepté', sujet: 'Votre demande de retour est acceptée',
    variables: [{ cle: 'prenom', desc: "Prénom de l'acheteur" }, { cle: 'numero_commande', desc: 'Numéro de commande' }, { cle: 'lien_commande', desc: 'Lien pour voir la commande' }],
    html: enveloppe('Retour accepté', p('Bonjour {$prenom},') + p('Votre demande de retour pour la commande <strong>{$numero_commande}</strong> a été acceptée. Vous recevrez les instructions pour renvoyer l\'article.') + bouton('Voir ma commande', '{$lien_commande}')),
  },
  {
    cle: 'retour_refuse', section: 'retours', destinataire: 'acheteur', branche: false,
    nom: 'Retour refusé', sujet: 'Votre demande de retour',
    variables: [{ cle: 'prenom', desc: "Prénom de l'acheteur" }, { cle: 'numero_commande', desc: 'Numéro de commande' }, { cle: 'motif', desc: 'Motif du refus' }],
    html: enveloppe('Demande de retour', p('Bonjour {$prenom},') + p('Nous ne pouvons pas accepter votre demande de retour pour la commande <strong>{$numero_commande}</strong>.') + encadre('{$motif}') + p('Vous pouvez répondre à ce courriel ou écrire à la boutique si vous avez des questions.')),
  },
  {
    cle: 'remboursement_effectue', section: 'retours', destinataire: 'acheteur', branche: false,
    nom: 'Remboursement effectué', sujet: 'Votre remboursement de {$montant_rembourse}',
    variables: [{ cle: 'prenom', desc: "Prénom de l'acheteur" }, { cle: 'numero_commande', desc: 'Numéro de commande' }, { cle: 'montant_rembourse', desc: 'Montant remboursé' }],
    html: enveloppe('Remboursement', p('Bonjour {$prenom},') + p('Nous avons remboursé <strong>{$montant_rembourse}</strong> pour la commande <strong>{$numero_commande}</strong>.') + p('Le montant apparaîtra sur votre relevé d\'ici quelques jours ouvrables, selon votre institution financière.')),
  },

  // ───────── Enchères ─────────
  {
    cle: 'enchere_gagnee', section: 'encheres', destinataire: 'acheteur', branche: false,
    nom: 'Enchère remportée', sujet: 'Félicitations ! Vous avez remporté « {$produit} »',
    variables: [{ cle: 'prenom', desc: "Prénom de l'acheteur" }, { cle: 'produit', desc: 'Nom du produit' }, { cle: 'prix_final', desc: 'Mise gagnante' }, { cle: 'delai_paiement', desc: 'Délai pour payer' }, { cle: 'lien_paiement', desc: 'Lien vers le panier pour payer' }],
    html: enveloppe('Enchère remportée', p('Bonjour {$prenom},') + p('Félicitations, vous avez remporté l\'enchère pour <strong>{$produit}</strong> avec une mise de <strong>{$prix_final}</strong> !') + encadre('Vous avez <strong>{$delai_paiement}</strong> pour finaliser votre paiement. Passé ce délai, l\'article sera remis en vente.') + bouton('Payer maintenant', '{$lien_paiement}')),
  },
  {
    cle: 'enchere_surpassee', section: 'encheres', destinataire: 'acheteur', branche: false,
    nom: 'Vous avez été surenchéri', sujet: 'Vous avez été surenchéri sur « {$produit} »',
    variables: [{ cle: 'prenom', desc: "Prénom de l'acheteur" }, { cle: 'produit', desc: 'Nom du produit' }, { cle: 'ancienne_mise', desc: 'Votre dernière mise' }, { cle: 'prix_final', desc: 'Nouvelle mise la plus haute' }, { cle: 'date_fin', desc: "Date de fin de l'enchère" }, { cle: 'lien_enchere', desc: "Lien vers l'enchère" }],
    html: enveloppe('Vous avez été surenchéri', p('Bonjour {$prenom},') + p('Quelqu\'un a placé une mise plus élevée que la vôtre sur <strong>{$produit}</strong>.') + encadre('<strong>Votre mise :</strong> {$ancienne_mise}<br><strong>Mise actuelle :</strong> {$prix_final}<br><strong>Fin de l\'enchère :</strong> {$date_fin}') + bouton('Miser à nouveau', '{$lien_enchere}')),
  },
  {
    cle: 'enchere_terminee_collab', section: 'encheres', destinataire: 'collaborateur', branche: false,
    nom: 'Enchère terminée avec gagnant — au collaborateur', sujet: 'Votre enchère « {$produit} » est conclue',
    variables: [{ cle: 'prenom_collaborateur', desc: 'Prénom du collaborateur' }, { cle: 'produit', desc: 'Nom du produit' }, { cle: 'prix_final', desc: 'Mise gagnante' }, { cle: 'delai_paiement', desc: 'Délai accordé au gagnant pour payer' }, { cle: 'lien_dashboard', desc: 'Lien vers son tableau de bord' }],
    html: enveloppe('Enchère conclue', p('Bonjour {$prenom_collaborateur},') + p('Votre enchère pour <strong>{$produit}</strong> est terminée avec une mise gagnante de <strong>{$prix_final}</strong>.') + p('Le gagnant a <strong>{$delai_paiement}</strong> pour payer. Vous serez avisé(e) dès que la commande sera créée.') + bouton('Voir mes enchères', '{$lien_dashboard}')),
  },
  {
    cle: 'enchere_sans_gagnant', section: 'encheres', destinataire: 'collaborateur', branche: false,
    nom: 'Enchère terminée sans gagnant — au collaborateur', sujet: 'Votre enchère « {$produit} » est terminée',
    variables: [{ cle: 'prenom_collaborateur', desc: 'Prénom du collaborateur' }, { cle: 'produit', desc: 'Nom du produit' }, { cle: 'prix_depart', desc: 'Prix de départ' }, { cle: 'lien_dashboard', desc: 'Lien vers son tableau de bord' }],
    html: enveloppe('Enchère terminée', p('Bonjour {$prenom_collaborateur},') + p('Votre enchère pour <strong>{$produit}</strong> (départ : {$prix_depart}) est terminée sans gagnant : aucune mise, ou prix de réserve non atteint.') + p('L\'article redevient disponible à la vente normale. Vous pouvez aussi relancer une nouvelle enchère.') + bouton('Voir mes annonces', '{$lien_dashboard}')),
  },
  {
    cle: 'enchere_paiement_expire', section: 'encheres', destinataire: 'collaborateur', branche: false,
    nom: "Gagnant n'a pas payé — au collaborateur", sujet: "Le gagnant n'a pas payé « {$produit} »",
    variables: [{ cle: 'prenom_collaborateur', desc: 'Prénom du collaborateur' }, { cle: 'produit', desc: 'Nom du produit' }, { cle: 'prix_final', desc: 'Mise gagnante' }, { cle: 'lien_dashboard', desc: 'Lien vers son tableau de bord' }],
    html: enveloppe('Paiement non reçu', p('Bonjour {$prenom_collaborateur},') + p('Le gagnant de l\'enchère pour <strong>{$produit}</strong> ({$prix_final}) n\'a pas payé dans le délai prévu. L\'enchère est annulée et l\'article est remis en vente.') + bouton('Voir mes annonces', '{$lien_dashboard}')),
  },

  // ───────── Messages ─────────
  {
    cle: 'nouveau_message', section: 'messages', destinataire: 'acheteur', branche: false,
    nom: 'Nouveau message reçu', sujet: 'Nouveau message de {$expediteur}',
    variables: [{ cle: 'prenom', desc: 'Prénom du destinataire' }, { cle: 'expediteur', desc: "Nom de l'expéditeur" }, { cle: 'extrait_message', desc: 'Début du message' }, { cle: 'lien_messagerie', desc: 'Lien vers la messagerie' }],
    html: enveloppe('Nouveau message', p('Bonjour {$prenom},') + p('Vous avez reçu un nouveau message de <strong>{$expediteur}</strong> :') + encadre('{$extrait_message}') + bouton('Lire et répondre', '{$lien_messagerie}')),
  },

  // ───────── Modération ─────────
  {
    cle: 'boutique_signalee', section: 'moderation', destinataire: 'gestionnaire', branche: false,
    nom: 'Boutique signalée — au gestionnaire', sujet: 'Nouveau signalement : {$nom_boutique_signalee}',
    variables: [{ cle: 'nom_boutique_signalee', desc: 'Nom de la boutique signalée' }, { cle: 'raison_signalement', desc: 'Raison choisie par le visiteur' }, { cle: 'lien_signalements', desc: 'Lien vers la page Signalements' }],
    html: enveloppe('Nouveau signalement', p('Bonjour,') + p('Un visiteur a signalé la boutique <strong>{$nom_boutique_signalee}</strong>.') + encadre('<strong>Raison :</strong> {$raison_signalement}') + bouton('Voir le signalement', '{$lien_signalements}')),
  },
];

const parCle = new Map(MODELES.map((m) => [m.cle, m]));

module.exports = { COMMUNES, EXEMPLES, SECTIONS, MODELES, parCle };