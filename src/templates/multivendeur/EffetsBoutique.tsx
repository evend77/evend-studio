// @ts-nocheck
// CHEMIN : src/templates/multivendeur/EffetsBoutique.tsx
// e-Vend Studio — Rendu des effets de boutique (saison, vente, musique de fond) sur la boutique MV.
// Repris d'e-Vend (BoutiquePublique.jsx) : survol décoratif fixe, sans clic, sous la barre de navigation et les fenêtres.
import React, { useState, useEffect } from 'react';


// ─────────────────────────────────────────────────────────────────────────────
// 🎃 DÉCORATIONS SAISONNIÈRES SUR LA BOUTIQUE PUBLIQUE
// ─────────────────────────────────────────────────────────────────────────────
// Reprend le même principe que DecorationOverlay dans AppVendeur.tsx (tableau
// de bord vendeur) : un survol purement décoratif en position fixed, 100%
// opt-in (saison_active/effets_actifs/effets_config viennent du vendeur, via
// GET /api/boutique-publique/vendeur/:vendeurId). Catalogue dupliqué ici
// volontairement — la boutique publique et le dashboard vendeur sont deux
// applications front-end séparées, pas de import cross-app possible.
const EFFETS_SAISONNIERS_PUBLICS = {
    halloween: {
        guirlande:    { emoji: '🎃', type: 'guirlande', tailleMin: 16, tailleMax: 34, tailleDefaut: 20 },
        fantomes:     { emoji: '👻', type: 'flottant',  tailleMin: 16, tailleMax: 46, tailleDefaut: 26, nombreMin: 1, nombreMax: 8, nombreDefaut: 4 },
        chauvesouris: { emoji: '🦇', type: 'volant',    tailleMin: 14, tailleMax: 40, tailleDefaut: 22, nombreMin: 1, nombreMax: 8, nombreDefaut: 3 },
        faucheuse:    { emoji: '💀', type: 'marcheur' },
        araignees:    { emoji: '🕷️', type: 'pendu',     tailleMin: 14, tailleMax: 38, tailleDefaut: 20 },
    },
    noel: {
        traineau:          { emoji: '🎅🛷', type: 'vagabond', tailleMin: 30, tailleMax: 110, tailleDefaut: 55, vitesseMin: 14, vitesseMax: 50, vitesseDefaut: 26 },
        neige:             { emoji: '❄️', type: 'neige',    tailleMin: 10, tailleMax: 30, tailleDefaut: 16, nombreMin: 5, nombreMax: 60, nombreDefaut: 25, vitesseMin: 4, vitesseMax: 20, vitesseDefaut: 10 },
        'guirlande-lumiere': { emoji: '💡', type: 'guirlande', ampoules: true, tailleMin: 8, tailleMax: 20, tailleDefaut: 12, couleursDefaut: ['#ff4545', '#3ddc84', '#3d8bff', '#ff5ebd', '#ffd23d'], stylesAnimationDisponibles: ['fixe', 'scintillement', 'chenillard', 'vague'] },
        sapin:             { emoji: '🎄', type: 'statique', ancrage: 'bas-droite', tailleMin: 60, tailleMax: 160, tailleDefaut: 100 },
        bonhomme:          { emoji: '⛄', type: 'statique', ancrage: 'bas-gauche', tailleMin: 50, tailleMax: 140, tailleDefaut: 90 },
        'etoile-filante':  { emoji: '💫', type: 'filante', tailleMin: 18, tailleMax: 40, tailleDefaut: 26 },
        cadeaux:           { emoji: '🎁', type: 'flottant', tailleMin: 16, tailleMax: 44, tailleDefaut: 24, nombreMin: 1, nombreMax: 8, nombreDefaut: 3 },
    },
    'saint-valentin': {
        'pluie-coeurs':     { emoji: '❤️', type: 'neige', emojisChute: ['❤️', '💕', '💖'], tailleMin: 10, tailleMax: 30, tailleDefaut: 16, nombreMin: 5, nombreMax: 60, nombreDefaut: 25, vitesseMin: 4, vitesseMax: 20, vitesseDefaut: 10 },
        'coeurs-flottants': { emoji: '💕', type: 'flottant', tailleMin: 16, tailleMax: 46, tailleDefaut: 26, nombreMin: 1, nombreMax: 8, nombreDefaut: 4 },
        'guirlande-coeurs': { emoji: '❤️', type: 'guirlande', tailleMin: 16, tailleMax: 34, tailleDefaut: 20 },
        cupidon:            { emoji: '💘', type: 'volant', tailleMin: 14, tailleMax: 40, tailleDefaut: 22, nombreMin: 1, nombreMax: 8, nombreDefaut: 3 },
        bouquet:            { emoji: '💐', type: 'statique', ancrage: 'bas-droite', tailleMin: 50, tailleMax: 140, tailleDefaut: 90 },
    },
    paques: {
        'pluie-oeufs':      { emoji: '🥚', type: 'neige', emojisChute: ['🥚'], tailleMin: 10, tailleMax: 30, tailleDefaut: 16, nombreMin: 5, nombreMax: 60, nombreDefaut: 25, vitesseMin: 4, vitesseMax: 20, vitesseDefaut: 10 },
        'fleurs-flottantes': { emoji: '🌷', type: 'flottant', tailleMin: 16, tailleMax: 46, tailleDefaut: 26, nombreMin: 1, nombreMax: 8, nombreDefaut: 4 },
        'guirlande-oeufs':  { emoji: '🥚', type: 'guirlande', tailleMin: 16, tailleMax: 34, tailleDefaut: 20 },
        lapin:              { emoji: '🐰', type: 'volant', tailleMin: 14, tailleMax: 40, tailleDefaut: 22, nombreMin: 1, nombreMax: 8, nombreDefaut: 3 },
        panier:             { emoji: '🧺', type: 'statique', ancrage: 'bas-gauche', tailleMin: 50, tailleMax: 140, tailleDefaut: 90 },
    },
    automne: {
        'pluie-feuilles':     { emoji: '🍁', type: 'neige', emojisChute: ['🍁', '🍂', '🍃'], tailleMin: 10, tailleMax: 30, tailleDefaut: 16, nombreMin: 5, nombreMax: 60, nombreDefaut: 25, vitesseMin: 4, vitesseMax: 20, vitesseDefaut: 10 },
        'feuilles-flottantes': { emoji: '🍂', type: 'flottant', tailleMin: 16, tailleMax: 46, tailleDefaut: 26, nombreMin: 1, nombreMax: 8, nombreDefaut: 4 },
        'guirlande-feuilles': { emoji: '🍁', type: 'guirlande', tailleMin: 16, tailleMax: 34, tailleDefaut: 20 },
        'oiseaux-migrateurs': { emoji: '🐦', type: 'volant', tailleMin: 14, tailleMax: 40, tailleDefaut: 22, nombreMin: 1, nombreMax: 8, nombreDefaut: 3 },
        recolte:              { emoji: '🎃🌽', type: 'statique', ancrage: 'bas-droite', tailleMin: 50, tailleMax: 140, tailleDefaut: 90 },
    },
    'nouvel-an': {
        'pluie-confettis':     { emoji: '🎊', type: 'neige', emojisChute: ['🎊', '🎉', '✨'], tailleMin: 10, tailleMax: 30, tailleDefaut: 16, nombreMin: 5, nombreMax: 60, nombreDefaut: 25, vitesseMin: 4, vitesseMax: 20, vitesseDefaut: 10 },
        'etincelles-flottantes': { emoji: '✨', type: 'flottant', tailleMin: 16, tailleMax: 46, tailleDefaut: 26, nombreMin: 1, nombreMax: 8, nombreDefaut: 4 },
        'guirlande-ballons':   { emoji: '🎈', type: 'guirlande', tailleMin: 16, tailleMax: 34, tailleDefaut: 20 },
        'feu-artifice':        { emoji: '🎆', type: 'filante', tailleMin: 18, tailleMax: 40, tailleDefaut: 26 },
        champagne:             { emoji: '🥂', type: 'statique', ancrage: 'bas-gauche', tailleMin: 50, tailleMax: 140, tailleDefaut: 90 },
    },
    'saint-patrick': {
        'pluie-trefles':     { emoji: '🍀', type: 'neige', emojisChute: ['🍀'], tailleMin: 10, tailleMax: 30, tailleDefaut: 16, nombreMin: 5, nombreMax: 60, nombreDefaut: 25, vitesseMin: 4, vitesseMax: 20, vitesseDefaut: 10 },
        'trefles-flottants': { emoji: '🍀', type: 'flottant', tailleMin: 16, tailleMax: 46, tailleDefaut: 26, nombreMin: 1, nombreMax: 8, nombreDefaut: 4 },
        'guirlande-trefles': { emoji: '🍀', type: 'guirlande', tailleMin: 16, tailleMax: 34, tailleDefaut: 20 },
        'arc-en-ciel':       { emoji: '🌈', type: 'volant', tailleMin: 14, tailleMax: 40, tailleDefaut: 22, nombreMin: 1, nombreMax: 8, nombreDefaut: 3 },
        'pot-or':            { emoji: '💰', type: 'statique', ancrage: 'bas-droite', tailleMin: 50, tailleMax: 140, tailleDefaut: 90 },
    },
};

// 🏷️ Effets de VENTE (Vendredi noir, liquidation, rubans, drapeaux...) —
// catégorie indépendante des thèmes saisonniers ci-dessus, peut tourner en
// même temps qu'une saison (voir AppVendeur.tsx pour la version dashboard,
// identique — gardée synchronisée ici pour la boutique publique).
const EFFETS_VENTE_PUBLICS = [
    {
        id: 'vendredi-noir', nom: 'Vendredi noir', emoji: '🏷️', type: 'texte3d',
        texteDefaut: 'VENDREDI NOIR', couleurTexteDefaut: '#1a1a1a',
        tailleMin: 18, tailleMax: 48, tailleDefaut: 28,
        nombreMin: 1, nombreMax: 15, nombreDefaut: 6,
        vitesseMin: 4, vitesseMax: 16, vitesseDefaut: 9,
        vitesseRotationMin: 1, vitesseRotationMax: 6, vitesseRotationDefaut: 2.5,
    },
    {
        id: 'liquidation', nom: 'Liquidation / Rabais', emoji: '💯', type: 'texte3d',
        texteDefaut: '50% RABAIS', couleurTexteDefaut: '#c0392b',
        tailleMin: 18, tailleMax: 48, tailleDefaut: 28,
        nombreMin: 1, nombreMax: 15, nombreDefaut: 6,
        vitesseMin: 4, vitesseMax: 16, vitesseDefaut: 9,
        vitesseRotationMin: 1, vitesseRotationMax: 6, vitesseRotationDefaut: 2.5,
    },
    {
        id: 'merci', nom: 'Merci', emoji: '🙏', type: 'texte3d',
        texteDefaut: 'MERCI', couleurTexteDefaut: 'var(--e-b-accent)',
        tailleMin: 18, tailleMax: 48, tailleDefaut: 26,
        nombreMin: 1, nombreMax: 15, nombreDefaut: 5,
        vitesseMin: 4, vitesseMax: 16, vitesseDefaut: 9,
        vitesseRotationMin: 1, vitesseRotationMax: 6, vitesseRotationDefaut: 2.5,
    },
    {
        id: 'joyeux-noel', nom: 'Joyeux Noël', emoji: '🎅', type: 'texte3d',
        texteDefaut: 'JOYEUX NOËL', couleurTexteDefaut: '#b91c1c',
        tailleMin: 18, tailleMax: 48, tailleDefaut: 26,
        nombreMin: 1, nombreMax: 15, nombreDefaut: 5,
        vitesseMin: 4, vitesseMax: 16, vitesseDefaut: 9,
        vitesseRotationMin: 1, vitesseRotationMax: 6, vitesseRotationDefaut: 2.5,
    },
    {
        id: 'texte-libre', nom: 'Texte personnalisé', emoji: '✏️', type: 'texte3d',
        texteDefaut: 'SOLDES', couleurTexteDefaut: '#2d6a9f',
        tailleMin: 18, tailleMax: 48, tailleDefaut: 26,
        nombreMin: 1, nombreMax: 15, nombreDefaut: 5,
        vitesseMin: 4, vitesseMax: 16, vitesseDefaut: 9,
        vitesseRotationMin: 1, vitesseRotationMax: 6, vitesseRotationDefaut: 2.5,
    },
    {
        id: 'rubans', nom: 'Rubans qui tombent', emoji: '🎀', type: 'ruban',
        couleurTexteDefaut: '#e0455f',
        tailleMin: 40, tailleMax: 120, tailleDefaut: 70,
        nombreMin: 2, nombreMax: 25, nombreDefaut: 10,
        vitesseMin: 3, vitesseMax: 14, vitesseDefaut: 7,
    },
    {
        id: 'drapeaux', nom: 'Drapeaux du Canada', emoji: '🇨🇦', type: 'drapeau',
        tailleMin: 20, tailleMax: 50, tailleDefaut: 30,
        nombreMin: 1, nombreMax: 20, nombreDefaut: 8,
        vitesseMin: 4, vitesseMax: 16, vitesseDefaut: 8,
        drapeauxDisponibles: [
            { id: 'ca', nom: 'Canada', couleurs: ['#ff0000', '#ffffff'] },
            { id: 'qc', nom: 'Québec', couleurs: ['#003DA5', '#ffffff'] },
            { id: 'on', nom: 'Ontario', couleurs: ['#c8102e', '#ffffff'] },
            { id: 'bc', nom: 'Colombie-Britannique', couleurs: ['#003DA5', '#FDB927'] },
            { id: 'ab', nom: 'Alberta', couleurs: ['#00205B', '#FFD700'] },
            { id: 'mb', nom: 'Manitoba', couleurs: ['#c8102e', '#00205b'] },
            { id: 'sk', nom: 'Saskatchewan', couleurs: ['#046A38', '#FFD700'] },
            { id: 'ns', nom: 'Nouvelle-Écosse', couleurs: ['#00247D', '#ffffff'] },
            { id: 'nb', nom: 'Nouveau-Brunswick', couleurs: ['#FFCE00', '#c8102e'] },
            { id: 'pe', nom: 'Île-du-Prince-Édouard', couleurs: ['#c8102e', '#046A38'] },
            { id: 'nl', nom: 'Terre-Neuve-et-Labrador', couleurs: ['#00205B', '#FFD700'] },
            { id: 'yt', nom: 'Yukon', couleurs: ['#00205B', '#046A38'] },
            { id: 'nt', nom: 'Territoires du Nord-Ouest', couleurs: ['#00205B', '#046A38'] },
            { id: 'nu', nom: 'Nunavut', couleurs: ['#FFD700', '#c8102e'] },
        ],
    },
];

// 🎅🦌 Illustration SVG "maison" (pas d'emoji Unicode combinant père Noël +
// traîneau + renne en une seule scène) — silhouette plate colorée, légère
// (pas d'image à charger). Identique à la version AppVendeur.tsx (dashboard).
function SvgTraineauPereNoel({ taille }) {
    const largeur = Math.round(taille * 2.3);
    return (
        <svg width={largeur} height={taille} viewBox="0 0 230 100" style={{ display: 'block' }}>
            <line x1="70" y1="62" x2="98" y2="66" stroke="#5b3a1a" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M30,80 L24,95 M40,82 L36,97 M55,80 L60,95 M64,78 L70,93" stroke="#6b3f1d" strokeWidth="4" strokeLinecap="round" fill="none" />
            <ellipse cx="46" cy="62" rx="26" ry="15" fill="#8b5a2b" />
            <path d="M70,58 Q78,56 76,64" stroke="#6b3f1d" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="18" cy="48" r="11" fill="#8b5a2b" />
            <ellipse cx="9" cy="50" rx="3.5" ry="3" fill="#c0392b" />
            <path d="M16,38 Q10,28 4,30 M16,38 Q13,26 20,24 M22,38 Q28,28 34,30 M22,38 Q26,26 19,22" stroke="#5b3a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M22,42 Q28,36 27,44" stroke="#6b3f1d" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M100,70 Q95,86 110,86 L175,86 Q188,86 186,72 L168,56 Q135,50 110,62 Z" fill="#c0392b" />
            <path d="M100,86 Q90,86 92,74 Q94,66 104,68" stroke="#FFD700" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M168,56 Q178,40 190,46 Q184,58 172,60 Z" fill="#a52d2d" />
            <ellipse cx="140" cy="62" rx="15" ry="17" fill="#c0392b" />
            <circle cx="140" cy="42" r="9" fill="#f4c9a0" />
            <path d="M131,44 Q140,58 149,44 Q149,54 140,56 Q131,54 131,44 Z" fill="#ffffff" />
            <path d="M132,36 Q140,24 152,34 Q146,32 140,34 Q135,33 132,36 Z" fill="#c0392b" />
            <circle cx="151" cy="33" r="3.5" fill="#ffffff" />
            <rect x="131" y="38" width="18" height="4" rx="2" fill="#ffffff" />
        </svg>
    );
}

// 🇨🇦 Union Jack simplifié réutilisé en canton par plusieurs drapeaux
// provinciaux (Ontario, Manitoba, Colombie-Britannique). Identique à la
// version dashboard (AppVendeur.tsx).
function UnionJackCanton() {
    return (
        <g>
            <rect width="24" height="18" fill="#00205B" />
            <path d="M0,0 L24,18 M24,0 L0,18" stroke="#ffffff" strokeWidth="3.6" />
            <path d="M0,0 L24,18 M24,0 L0,18" stroke="#c8102e" strokeWidth="1.4" />
            <rect x="9" width="6" height="18" fill="#ffffff" />
            <rect y="6" width="24" height="6" fill="#ffffff" />
            <rect x="10.5" width="3" height="18" fill="#c8102e" />
            <rect y="7.5" width="24" height="3" fill="#c8102e" />
        </g>
    );
}

// 🏳️ Drapeaux du Canada + provinces/territoires — bandes/croix/sautoir/canton
// fidèles au vrai drapeau, écussons simplifiés en formes géométriques.
// Identique à la version dashboard (AppVendeur.tsx).
function FlagIcon({ id, taille }) {
    const largeur = Math.round(taille * (60 / 36));
    const commonProps = {
        width: largeur, height: taille, viewBox: '0 0 60 36',
        style: { display: 'block', borderRadius: '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.25)' },
    };
    switch (id) {
        case 'ca':
            return (
                <svg {...commonProps}>
                    <rect width="60" height="36" fill="#ffffff" />
                    <rect width="15" height="36" fill="#d52b1e" />
                    <rect x="45" width="15" height="36" fill="#d52b1e" />
                    <path d="M30,6 L32,13 L38,12 L34,17 L38,18 L32,20 L33,27 L30,23 L27,27 L28,20 L22,18 L26,17 L22,12 L28,13 Z" fill="#d52b1e" />
                </svg>
            );
        case 'qc':
            return (
                <svg {...commonProps}>
                    <rect width="60" height="36" fill="#003DA5" />
                    <rect x="26" width="8" height="36" fill="#ffffff" />
                    <rect y="14" width="60" height="8" fill="#ffffff" />
                    <circle cx="13" cy="8" r="2.4" fill="#ffffff" />
                    <circle cx="47" cy="8" r="2.4" fill="#ffffff" />
                    <circle cx="13" cy="28" r="2.4" fill="#ffffff" />
                    <circle cx="47" cy="28" r="2.4" fill="#ffffff" />
                </svg>
            );
        case 'on':
            return (
                <svg {...commonProps}>
                    <rect width="60" height="36" fill="#c8102e" />
                    <UnionJackCanton />
                    <circle cx="46" cy="24" r="6" fill="#ffffff" />
                    <path d="M46,20 L48,26 L44,26 Z" fill="#c8102e" />
                </svg>
            );
        case 'mb':
            return (
                <svg {...commonProps}>
                    <rect width="60" height="36" fill="#c8102e" />
                    <UnionJackCanton />
                    <circle cx="46" cy="24" r="6" fill="#ffffff" />
                    <path d="M43,22 L49,22 L49,26 L46,28 L43,26 Z" fill="#00205b" />
                </svg>
            );
        case 'bc':
            return (
                <svg {...commonProps}>
                    <rect width="60" height="18" fill="#003DA5" />
                    <rect y="18" width="60" height="18" fill="#ffffff" />
                    <path d="M0,22 Q7.5,18 15,22 T30,22 T45,22 T60,22 V36 H0 Z" fill="#003DA5" />
                    <circle cx="30" cy="18" r="9" fill="#FDB927" />
                    <g transform="scale(0.42)"><UnionJackCanton /></g>
                </svg>
            );
        case 'ab':
            return (
                <svg {...commonProps}>
                    <rect width="60" height="36" fill="#00205B" />
                    <rect x="24" y="10" width="12" height="16" fill="#ffffff" />
                    <rect x="24" y="10" width="12" height="4" fill="#c8102e" />
                    <path d="M24,26 L30,20 L36,26 Z" fill="#046A38" />
                </svg>
            );
        case 'sk':
            return (
                <svg {...commonProps}>
                    <rect width="60" height="12" fill="#046A38" />
                    <rect y="12" width="60" height="24" fill="#FFD700" />
                    <rect x="5" y="3" width="8" height="6" fill="#ffffff" />
                    <circle cx="48" cy="24" r="3" fill="#c8102e" />
                </svg>
            );
        case 'ns':
            return (
                <svg {...commonProps}>
                    <rect width="60" height="36" fill="#ffffff" />
                    <line x1="0" y1="0" x2="60" y2="36" stroke="#00247D" strokeWidth="7" />
                    <line x1="60" y1="0" x2="0" y2="36" stroke="#00247D" strokeWidth="7" />
                    <circle cx="30" cy="18" r="6" fill="#ffffff" stroke="#00247D" strokeWidth="1.5" />
                    <rect x="27" y="14" width="6" height="8" fill="#c8102e" />
                </svg>
            );
        case 'nb':
            return (
                <svg {...commonProps}>
                    <rect width="60" height="36" fill="#FFCE00" />
                    <rect width="60" height="8" fill="#c8102e" />
                    <path d="M12,26 L48,26 L42,32 L18,32 Z" fill="#6b3f1d" />
                    <line x1="18" y1="26" x2="18" y2="12" stroke="#6b3f1d" strokeWidth="1.5" />
                    <path d="M18,12 L34,20 L18,22 Z" fill="#ffffff" />
                </svg>
            );
        case 'pe':
            return (
                <svg {...commonProps}>
                    <rect width="60" height="36" fill="#fdf6e3" />
                    <rect width="60" height="36" fill="none" stroke="#c8102e" strokeWidth="3" />
                    <rect y="26" width="60" height="10" fill="#046A38" />
                    <path d="M28,26 L28,14 L22,24 L28,20 L24,26 Z" fill="#046A38" />
                    <path d="M14,26 L14,20 L10,25 L14,23 L12,26 Z" fill="#046A38" />
                    <path d="M42,26 L42,20 L38,25 L42,23 L40,26 Z" fill="#046A38" />
                </svg>
            );
        case 'nl':
            return (
                <svg {...commonProps}>
                    <rect width="60" height="36" fill="#ffffff" />
                    <path d="M0,0 L20,18 L0,36 Z" fill="#003DA5" />
                    <path d="M20,18 L60,4 L60,10 L28,18 L60,26 L60,32 Z" fill="#c8102e" />
                    <path d="M20,18 L52,8 L46,18 L52,28 Z" fill="#FFD700" />
                </svg>
            );
        case 'yt':
            return (
                <svg {...commonProps}>
                    <rect width="20" height="36" fill="#046A38" />
                    <rect x="20" width="20" height="36" fill="#ffffff" />
                    <rect x="40" width="20" height="36" fill="#00205B" />
                    <circle cx="30" cy="18" r="7" fill="#ffffff" stroke="#00205B" strokeWidth="1.5" />
                    <path d="M30,13 L33,20 L27,20 Z" fill="#046A38" />
                </svg>
            );
        case 'nt':
            return (
                <svg {...commonProps}>
                    <rect width="15" height="36" fill="#00205B" />
                    <rect x="15" width="30" height="36" fill="#ffffff" />
                    <rect x="45" width="15" height="36" fill="#00205B" />
                    <circle cx="30" cy="18" r="6" fill="#ffffff" stroke="#00205B" strokeWidth="1.5" />
                </svg>
            );
        case 'nu':
            return (
                <svg {...commonProps}>
                    <polygon points="0,0 60,0 0,36" fill="#FFD700" />
                    <polygon points="60,0 60,36 0,36" fill="#c8102e" />
                    <path d="M15,26 L15,14 M11,14 L19,14 M11,10 L19,10 M13,10 L13,6 M17,10 L17,6" stroke="#00205B" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                    <path d="M46,10 L47.5,14 L52,14 L48.5,16.5 L50,21 L46,18 L42,21 L43.5,16.5 L40,14 L44.5,14 Z" fill="#c8102e" />
                </svg>
            );
        default:
            return (
                <svg {...commonProps}>
                    <rect width="60" height="36" fill="#c8102e" />
                    <rect y="14" width="60" height="8" fill="#ffffff" />
                </svg>
            );
    }
}

export function DecorationOverlayPublique({ saison, effets, effetsConfig, topOffset, venteEffets, venteEffetsConfig }) {
    const [largeur, setLargeur] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
    useEffect(() => {
        const onResize = () => setLargeur(window.innerWidth);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const catalogue = saison ? EFFETS_SAISONNIERS_PUBLICS[saison] : null;
    const actifsSaisonniers = (catalogue && Array.isArray(effets))
        ? Object.keys(catalogue).filter(id => effets.includes(id)).map(id => ({ id, ...catalogue[id] }))
        : [];
    const actifsVente = (Array.isArray(venteEffets) && venteEffets.length > 0)
        ? EFFETS_VENTE_PUBLICS.filter(e => venteEffets.includes(e.id))
        : [];
    const actifs = [...actifsSaisonniers, ...actifsVente];
    if (actifs.length === 0) return null;

    // Les deux catégories ont chacune leur propre stockage mais des ids
    // d'effets distincts — fusion sans risque de collision.
    const configCombine = { ...(effetsConfig || {}), ...(venteEffetsConfig || {}) };

    const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
    const getTaille = (effet) => {
        if (effet.tailleDefaut == null) return undefined;
        const val = (configCombine[effet.id] && configCombine[effet.id].taille) ?? effet.tailleDefaut;
        return clamp(val, effet.tailleMin ?? effet.tailleDefaut, effet.tailleMax ?? effet.tailleDefaut);
    };
    const getNombre = (effet) => {
        if (effet.nombreDefaut == null) return undefined;
        const val = (configCombine[effet.id] && configCombine[effet.id].nombre) ?? effet.nombreDefaut;
        return clamp(val, effet.nombreMin ?? effet.nombreDefaut, effet.nombreMax ?? effet.nombreDefaut);
    };
    const getVitesse = (effet) => {
        if (effet.vitesseDefaut == null) return undefined;
        const val = (configCombine[effet.id] && configCombine[effet.id].vitesse) ?? effet.vitesseDefaut;
        return clamp(val, effet.vitesseMin ?? effet.vitesseDefaut, effet.vitesseMax ?? effet.vitesseDefaut);
    };
    const getVitesseRotation = (effet) => {
        if (effet.vitesseRotationDefaut == null) return undefined;
        const val = (configCombine[effet.id] && configCombine[effet.id].vitesseRotation) ?? effet.vitesseRotationDefaut;
        return clamp(val, effet.vitesseRotationMin ?? effet.vitesseRotationDefaut, effet.vitesseRotationMax ?? effet.vitesseRotationDefaut);
    };

    const hautDepart = (topOffset || 60) + 4;

    // zIndex 950 : au-dessus du contenu de page, mais SOUS la barre de nav
    // sticky (zIndex 1000) et les modales (zIndex 1200-9999) — les
    // décorations ne cachent donc jamais un menu ou une fenêtre.
    return (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 950, overflow: 'hidden' }} aria-hidden="true">
            {actifs.map(effet => {
                if (effet.type === 'guirlande') {
                    const taille = getTaille(effet) ?? 20;
                    const espacement = taille * 2.4;
                    const nb = clamp(Math.round(Math.max(280, largeur) / espacement), 6, 40);
                    const H = 46, yBas = 36, yHaut = 10;
                    const xs = Array.from({ length: nb }).map((_, i) => ((i + 0.5) / nb) * 100);
                    let path = `M ${xs[0]},${yBas}`;
                    for (let i = 0; i < xs.length - 1; i++) {
                        const midX = (xs[i] + xs[i + 1]) / 2;
                        path += ` Q ${midX},${yHaut} ${xs[i + 1]},${yBas}`;
                    }
                    const couleurs = effet.ampoules
                        ? ((configCombine[effet.id] && configCombine[effet.id].couleurs) ?? effet.couleursDefaut ?? ['#ff4545'])
                        : undefined;
                    const styleAnim = effet.ampoules
                        ? ((configCombine[effet.id] && configCombine[effet.id].styleAnimation) ?? (effet.stylesAnimationDisponibles && effet.stylesAnimationDisponibles[0]) ?? 'fixe')
                        : undefined;
                    const dureeChenillard = nb * 0.14;
                    return (
                        <div key={effet.id} style={{ position: 'fixed', top: `${hautDepart}px`, left: 0, right: 0, height: `${H}px` }}>
                            <svg width="100%" height={H} viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
                                <path d={path} fill="none" stroke="rgba(90, 60, 20, 0.45)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
                            </svg>
                            {xs.map((x, i) => {
                                if (!effet.ampoules) {
                                    return (
                                        <span key={i} style={{ position: 'absolute', left: `${x}%`, top: `${yBas}px`, transform: 'translate(-50%, -50%)', fontSize: `${taille}px`, lineHeight: 1 }}>
                                            {effet.emoji}
                                        </span>
                                    );
                                }
                                const couleur = couleurs[i % couleurs.length];
                                let animStyle = {};
                                if (styleAnim === 'scintillement') {
                                    animStyle = { animation: `e-bulb-twinkle ${1.2 + (i % 3) * 0.35}s ease-in-out infinite`, animationDelay: `${(i * 0.37) % 2}s` };
                                } else if (styleAnim === 'chenillard') {
                                    animStyle = { animation: `e-bulb-chase ${dureeChenillard}s linear infinite`, animationDelay: `${-(i * 0.14)}s` };
                                } else if (styleAnim === 'vague') {
                                    animStyle = { animation: `e-bulb-wave ${dureeChenillard}s ease-in-out infinite`, animationDelay: `${-(i * 0.14)}s` };
                                }
                                return (
                                    <span key={i} style={{
                                        position: 'absolute', left: `${x}%`, top: `${yBas}px`, transform: 'translate(-50%, -50%)',
                                        width: `${taille}px`, height: `${taille}px`, borderRadius: '50%',
                                        backgroundColor: couleur, boxShadow: `0 0 ${Math.round(taille * 0.9)}px ${couleur}`,
                                        ...animStyle,
                                    }} />
                                );
                            })}
                        </div>
                    );
                }
                if (effet.type === 'neige') {
                    const taille = getTaille(effet) ?? 16;
                    const nb = getNombre(effet) ?? 25;
                    const vitesse = getVitesse(effet) ?? 10;
                    const flocons = (effet.emojisChute && effet.emojisChute.length > 0) ? effet.emojisChute : ['❄️', '❅', '❆'];
                    const items = Array.from({ length: nb }).map((_, i) => ({
                        startX: (i * 173) % 100,
                        duree: (vitesse * (0.7 + ((i * 37) % 60) / 100)).toFixed(1),
                        delai: ((i * 1.7) % vitesse).toFixed(1),
                        ampleur: 16 + (i % 4) * 14,
                        dureeSway: (2.4 + (i % 3) * 0.6).toFixed(1),
                        emoji: flocons[i % flocons.length],
                    }));
                    return (
                        <React.Fragment key={effet.id}>
                            {items.map((f, i) => (
                                <div key={i} style={{ position: 'fixed', top: '-6%', left: `${f.startX}%`, animation: `e-snow-fall ${f.duree}s linear infinite`, animationDelay: `-${f.delai}s` }}>
                                    <span style={{ display: 'inline-block', fontSize: `${taille}px`, opacity: 0.85, color: '#dceeff', animation: `e-snow-sway ${f.dureeSway}s ease-in-out infinite alternate`, '--e-sway': `${f.ampleur}px` }}>
                                        {f.emoji}
                                    </span>
                                </div>
                            ))}
                        </React.Fragment>
                    );
                }
                if (effet.type === 'filante') {
                    const taille = getTaille(effet) ?? 26;
                    const etoiles = [
                        { top: '8%', left: '4%', duree: '9s', delai: '0s' },
                        { top: '20%', left: '52%', duree: '13s', delai: '5s' },
                    ];
                    return (
                        <React.Fragment key={effet.id}>
                            {etoiles.map((e, i) => (
                                <span key={i} style={{ position: 'fixed', top: e.top, left: e.left, fontSize: `${taille}px`, animation: `e-shoot ${e.duree} ease-in infinite`, animationDelay: e.delai }}>
                                    {effet.emoji}
                                </span>
                            ))}
                        </React.Fragment>
                    );
                }
                if (effet.type === 'statique') {
                    const taille = getTaille(effet) ?? 90;
                    const posStyle = effet.ancrage === 'bas-droite' ? { right: '18px' } : { left: '18px' };
                    return (
                        <div key={effet.id} style={{ position: 'fixed', bottom: '20px', ...posStyle, fontSize: `${taille}px`, lineHeight: 1, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.25))' }}>
                            {effet.emoji}
                        </div>
                    );
                }
                if (effet.type === 'vagabond') {
                    const taille = getTaille(effet) ?? 40;
                    const vitesse = getVitesse(effet) ?? 26;
                    return (
                        <div key={effet.id} style={{ position: 'fixed', animation: `e-wander ${vitesse}s ease-in-out infinite`, filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.3))' }}>
                            {effet.id === 'traineau'
                                ? <img src="https://admin-media.e-vend.ca/divers/1790608064308-pere_noel_traineau_transparent.png" alt="" style={{ height: `${taille}px`, width: 'auto', display: 'block' }} />
                                : <span style={{ display: 'block', fontSize: `${taille}px`, lineHeight: 1 }}>{effet.emoji}</span>}
                        </div>
                    );
                }
                if (effet.type === 'texte3d') {
                    const taille = getTaille(effet) ?? 28;
                    const nb = getNombre(effet) ?? 6;
                    const vitesse = getVitesse(effet) ?? 9;
                    const vitesseRotation = getVitesseRotation(effet) ?? 2.5;
                    const texte = (configCombine[effet.id] && configCombine[effet.id].texte) ?? effet.texteDefaut ?? '';
                    const couleur = (configCombine[effet.id] && configCombine[effet.id].couleur) ?? effet.couleurTexteDefaut ?? '#1a2332';
                    if (!texte.trim()) return null;
                    const items = Array.from({ length: nb }).map((_, i) => ({
                        startX: (i * 137) % 100,
                        duree: (vitesse * (0.75 + ((i * 29) % 50) / 100)).toFixed(1),
                        delai: ((i * 1.3) % vitesse).toFixed(1),
                        dureeRot: (vitesseRotation * (0.8 + (i % 3) * 0.2)).toFixed(1),
                    }));
                    return (
                        <React.Fragment key={effet.id}>
                            {items.map((it, i) => (
                                <div key={i} style={{ position: 'fixed', top: '-8%', left: `${it.startX}%`, animation: `e-word-fall ${it.duree}s linear infinite`, animationDelay: `-${it.delai}s` }}>
                                    <span style={{ display: 'inline-block', fontSize: `${taille}px`, fontWeight: 800, color: couleur, whiteSpace: 'nowrap', textShadow: '0 2px 4px rgba(0,0,0,0.25)', animation: `e-word-flip ${it.dureeRot}s linear infinite` }}>
                                        {texte}
                                    </span>
                                </div>
                            ))}
                        </React.Fragment>
                    );
                }
                if (effet.type === 'ruban') {
                    const longueur = getTaille(effet) ?? 70;
                    const nb = getNombre(effet) ?? 10;
                    const vitesse = getVitesse(effet) ?? 7;
                    const couleur = (configCombine[effet.id] && configCombine[effet.id].couleur) ?? effet.couleurTexteDefaut ?? '#e0455f';
                    const largeurSvg = Math.max(10, Math.round(longueur * 0.3));
                    const epaisseur = Math.max(3, Math.round(longueur / 13));
                    const items = Array.from({ length: nb }).map((_, i) => ({
                        startX: (i * 113) % 100,
                        duree: (vitesse * (0.7 + ((i * 41) % 60) / 100)).toFixed(1),
                        delai: ((i * 1.1) % vitesse).toFixed(1),
                        ampleur: 14 + (i % 4) * 10,
                        dureeSway: (1.6 + (i % 3) * 0.4).toFixed(1),
                        dureeRot: (0.7 + (i % 4) * 0.25).toFixed(2),
                    }));
                    return (
                        <React.Fragment key={effet.id}>
                            {items.map((it, i) => (
                                <div key={i} style={{
                                    position: 'fixed', top: '-8%', left: `${it.startX}%`,
                                    animation: `e-word-fall ${it.duree}s linear infinite, e-snow-sway ${it.dureeSway}s ease-in-out infinite alternate`,
                                    animationDelay: `-${it.delai}s, 0s`,
                                    '--e-sway': `${it.ampleur}px`,
                                }}>
                                    <svg width={largeurSvg} height={longueur} viewBox="0 0 26 90" style={{ animation: `e-ruban-rotate ${it.dureeRot}s linear infinite`, transformOrigin: '50% 50%' }}>
                                        <path d="M13,0 C20,10 6,20 13,30 C20,40 6,50 13,60 C20,70 6,80 13,90" stroke={couleur} strokeWidth={epaisseur} strokeLinecap="round" fill="none" />
                                    </svg>
                                </div>
                            ))}
                        </React.Fragment>
                    );
                }
                if (effet.type === 'drapeau') {
                    const taille = getTaille(effet) ?? 30;
                    const nb = getNombre(effet) ?? 8;
                    const vitesse = getVitesse(effet) ?? 8;
                    const selection = (configCombine[effet.id] && configCombine[effet.id].drapeaux) ?? (effet.drapeauxDisponibles ? [effet.drapeauxDisponibles[0].id] : []);
                    const drapeaux = (effet.drapeauxDisponibles ?? []).filter(d => selection.includes(d.id));
                    if (drapeaux.length === 0) return null;
                    const items = Array.from({ length: nb }).map((_, i) => ({
                        startX: (i * 151) % 100,
                        duree: (vitesse * (0.7 + ((i * 23) % 60) / 100)).toFixed(1),
                        delai: ((i * 1.4) % vitesse).toFixed(1),
                        dureeSwing: (1.4 + (i % 3) * 0.3).toFixed(1),
                        drapeau: drapeaux[i % drapeaux.length],
                    }));
                    return (
                        <React.Fragment key={effet.id}>
                            {items.map((it, i) => (
                                <div key={i} style={{ position: 'fixed', top: '-8%', left: `${it.startX}%`, animation: `e-word-fall ${it.duree}s linear infinite`, animationDelay: `-${it.delai}s` }}>
                                    <div style={{ animation: `e-swing ${it.dureeSwing}s ease-in-out infinite alternate`, transformOrigin: 'top center' }}>
                                        <FlagIcon id={it.drapeau.id} taille={taille} />
                                    </div>
                                </div>
                            ))}
                        </React.Fragment>
                    );
                }
                if (effet.type === 'flottant') {
                    const taille = getTaille(effet) ?? 26;
                    const nb = getNombre(effet) ?? 4;
                    const positions = Array.from({ length: nb }).map((_, i) => {
                        const cote = i % 2 === 0 ? 'left' : 'right';
                        const top = `${8 + (i * (80 / Math.max(1, nb))) % 80}%`;
                        const decalage = `${2 + (i % 3) * 3}%`;
                        const delay = `${((i * 0.7) % 3.5).toFixed(1)}s`;
                        return { style: { top, [cote]: decalage }, delay };
                    });
                    return (
                        <React.Fragment key={effet.id}>
                            {positions.map((pos, i) => (
                                <span key={i} style={{ position: 'fixed', fontSize: `${taille}px`, opacity: 0.85, animation: 'e-float 3.5s ease-in-out infinite', animationDelay: pos.delay, ...pos.style }}>
                                    {effet.emoji}
                                </span>
                            ))}
                        </React.Fragment>
                    );
                }
                if (effet.type === 'volant') {
                    const taille = getTaille(effet) ?? 22;
                    const nb = getNombre(effet) ?? 3;
                    const vols = Array.from({ length: nb }).map((_, i) => ({
                        top: `${10 + (i * (70 / Math.max(1, nb))) % 70}%`,
                        duration: `${9 + (i % 3) * 2}s`,
                        delay: `${(i * 2.5) % 9}s`,
                    }));
                    return (
                        <React.Fragment key={effet.id}>
                            {vols.map((cfg, i) => (
                                <span key={i} style={{ position: 'fixed', top: cfg.top, left: 0, fontSize: `${taille}px`, animation: `e-fly ${cfg.duration} linear infinite`, animationDelay: cfg.delay }}>
                                    {effet.emoji}
                                </span>
                            ))}
                        </React.Fragment>
                    );
                }
                if (effet.type === 'marcheur') {
                    const taille = getTaille(effet) ?? 34;
                    const vitesse = getVitesse(effet) ?? 16;
                    const posY = effet.positionMarcheur === 'haut' ? { top: `${hautDepart}px` } : { bottom: '18px' };
                    return (
                        <div key={effet.id} style={{ position: 'fixed', ...posY, left: '-60px', animation: `e-walk ${vitesse}s linear infinite` }}>
                            <span style={{ display: 'inline-block', fontSize: `${taille}px`, animation: 'e-swing 0.6s ease-in-out infinite alternate' }}>
                                {effet.emoji}
                            </span>
                        </div>
                    );
                }
                if (effet.type === 'pendu') {
                    const taille = getTaille(effet) ?? 20;
                    const araignees = [
                        { left: '10%',  drop: 130, duration: '4.2s', delay: '0s' },
                        { right: '12%', drop: 90,  duration: '3.4s', delay: '1.2s' },
                        { left: '48%',  drop: 160, duration: '5.1s', delay: '2.1s' },
                    ];
                    return (
                        <React.Fragment key={effet.id}>
                            {araignees.map((a, i) => (
                                <div key={i} style={{
                                    position: 'fixed', top: `${hautDepart}px`,
                                    ...(a.left ? { left: a.left } : { right: a.right }),
                                    width: '1px', height: `${a.drop}px`, background: 'rgba(0,0,0,0.3)',
                                }}>
                                    <span style={{
                                        position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', fontSize: `${taille}px`,
                                        animation: `e-spider-drop ${a.duration} ease-in-out infinite`, animationDelay: a.delay,
                                        '--e-drop': `${a.drop - 20}px`,
                                    }}>
                                        <span style={{ display: 'inline-block', animation: 'e-spider-legs 0.35s ease-in-out infinite alternate' }}>
                                            {effet.emoji}
                                        </span>
                                    </span>
                                </div>
                            ))}
                        </React.Fragment>
                    );
                }
                return null;
            })}
            <style>{`
                @keyframes e-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
                @keyframes e-fly { from { transform: translateX(-10vw); } to { transform: translateX(110vw); } }
                @keyframes e-walk { from { transform: translateX(0); } to { transform: translateX(calc(100vw + 60px)); } }
                @keyframes e-swing { from { transform: rotate(-8deg); } to { transform: rotate(8deg); } }
                @keyframes e-spider-drop { 0%, 100% { top: 0; } 50% { top: var(--e-drop, 100px); } }
                @keyframes e-spider-legs { from { transform: rotate(-6deg); } to { transform: rotate(6deg); } }
                @keyframes e-snow-fall { 0% { top: -6%; } 100% { top: 105%; } }
                @keyframes e-snow-sway { 0% { transform: translateX(calc(var(--e-sway, 20px) * -1)); } 100% { transform: translateX(var(--e-sway, 20px)); } }
                @keyframes e-shoot {
                    0%   { transform: translate(0, 0) rotate(-35deg); opacity: 0; }
                    2%   { opacity: 1; }
                    9%   { opacity: 1; transform: translate(46vw, 32vh) rotate(-35deg); }
                    11%  { opacity: 0; }
                    100% { opacity: 0; }
                }
                @keyframes e-bulb-twinkle {
                    0%, 100% { opacity: 0.35; transform: translate(-50%, -50%) scale(0.85); }
                    50%      { opacity: 1;    transform: translate(-50%, -50%) scale(1.15); }
                }
                @keyframes e-bulb-chase {
                    0%, 85%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(0.9); }
                    10%            { opacity: 1;   transform: translate(-50%, -50%) scale(1.2); }
                }
                @keyframes e-bulb-wave {
                    0%, 85%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.85); }
                    10%            { opacity: 1;   transform: translate(-50%, -50%) scale(1.35); }
                }
                @keyframes e-word-fall { 0% { top: -8%; } 100% { top: 106%; } }
                @keyframes e-word-flip { 0% { transform: rotateY(0deg); } 100% { transform: rotateY(360deg); } }
                @keyframes e-ruban-rotate {
                    0%   { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes e-wander {
                    0%   { top: 8%;  left: -12%; }
                    14%  { top: 24%; left: 28%; }
                    28%  { top: 58%; left: 62%; }
                    42%  { top: 14%; left: 88%; }
                    57%  { top: 72%; left: 42%; }
                    71%  { top: 38%; left: 8%; }
                    85%  { top: 64%; left: 78%; }
                    100% { top: 8%;  left: -12%; }
                }
            `}</style>
        </div>
    );
}

// 🎵 Musique de fond — BOUTIQUE PUBLIQUE UNIQUEMENT (jamais le dashboard
// vendeur, pour ne pas gêner le vendeur qui y travaille des heures). 100%
// opt-in : musique_fond_url est null par défaut = rien ne joue, aucun
// changement pour les boutiques qui n'ont jamais touché ce réglage.
// 🆕 Le catalogue des pistes (nom/catégorie/emoji/url) vit maintenant dans la
// table musiques_fond_catalogue, gérée depuis la page admin "Musiques" — plus
// de liste codée en dur ici. boutiquePublique.js (backend) résout déjà l'URL
// jouable via une jointure et nous la passe directement en prop.
export function MusiqueDeFondPublique({ url, config }) {
    const audioRef = React.useRef(null);
    // 🔊 Politique d'autoplay des navigateurs (Chrome/Safari/Firefox) : le son
    // ne peut JAMAIS démarrer automatiquement. On démarre donc en sourdine
    // (autorisé), et le vrai son s'active dès la première interaction du
    // visiteur n'importe où sur la page — ou via le bouton haut-parleur.
    const [enSourdine, setEnSourdine] = useState(true);
    const volume = Math.min(1, Math.max(0, (config?.volume ?? 45) / 100));
    const boucle = config?.boucle !== false;

    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volume;
    }, [volume]);

    useEffect(() => {
        if (!url) return undefined;
        const audio = audioRef.current;
        if (!audio) return undefined;
        audio.muted = true;
        audio.play().catch(() => {});
        const activerAuPremierClic = () => {
            if (!audioRef.current) return;
            audioRef.current.muted = false;
            audioRef.current.play().catch(() => {});
            setEnSourdine(false);
        };
        const evenements = ['click', 'touchstart', 'keydown'];
        evenements.forEach(ev => window.addEventListener(ev, activerAuPremierClic, { once: true, passive: true }));
        return () => evenements.forEach(ev => window.removeEventListener(ev, activerAuPremierClic));
    }, [url]);

    if (!url) return null;

    const toggleSon = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (enSourdine) {
            audio.muted = false;
            audio.play().catch(() => {});
            setEnSourdine(false);
        } else {
            audio.muted = true;
            setEnSourdine(true);
        }
    };

    return (
        <>
            <audio ref={audioRef} src={url} loop={boucle} preload="auto" />
            <button
                onClick={toggleSon}
                title={enSourdine ? 'Activer la musique de fond' : 'Couper la musique de fond'}
                aria-label={enSourdine ? 'Activer la musique de fond' : 'Couper la musique de fond'}
                style={{
                    position: 'fixed', bottom: '20px', left: '20px', zIndex: 980,
                    width: '52px', height: '52px', borderRadius: '50%', border: 'none',
                    background: '#1a2332', color: '#fff', fontSize: '22px', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', transition: 'transform 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
                {enSourdine ? '🔇' : '🔊'}
            </button>
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant monté dans TemplateMultiVendeurPremium (seulement si l'add-on « Effets de boutique » est actif).
// Va chercher la config publique de la boutique, puis dessine les effets + la musique.
// Rien ne s'affiche si le gestionnaire n'a rien choisi, ni si le visiteur a demandé « moins d'animations ».
// ─────────────────────────────────────────────────────────────────────────────
export default function EffetsBoutique({ gestionnaireId, topOffset = 70 }: { gestionnaireId: number | string; topOffset?: number }) {
  const [cfg, setCfg] = useState<any>(null);
  const [reduit, setReduit] = useState(false);

  useEffect(() => {
    try { setReduit(!!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)); } catch { /* ignoré */ }
  }, []);

  useEffect(() => {
    if (!gestionnaireId) return;
    let actif = true;
    fetch(`/api/effets-boutique/public/${gestionnaireId}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (actif) setCfg(d && d.actif ? d : null); })
      .catch(() => {});
    return () => { actif = false; };
  }, [gestionnaireId]);

  if (!cfg) return null;
  return (
    <>
      {!reduit && (
        <DecorationOverlayPublique
          saison={cfg.saison}
          effets={cfg.effets}
          effetsConfig={cfg.effetsConfig}
          venteEffets={cfg.venteEffets}
          venteEffetsConfig={cfg.venteEffetsConfig}
          topOffset={topOffset}
        />
      )}
      <MusiqueDeFondPublique url={cfg.musiqueUrl} config={cfg.musiqueConfig} />
    </>
  );
}