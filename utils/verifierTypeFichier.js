// utils/verifierTypeFichier.js
//
// Vérifie le VRAI type d'un fichier en lisant ses premiers octets
// ("magic bytes"), plutôt que de faire confiance à l'extension du nom
// ou au Content-Type déclaré par le client — les deux sont falsifiables
// par un attaquant (renommer un fichier + mentir sur le Content-Type
// suffit à contourner un simple contrôle d'extension/mimetype).
//
// Utilisation :
//   const { verifierTypeFichier } = require('../utils/verifierTypeFichier');
//   const ok = await verifierTypeFichier(buffer, ['jpg', 'png', 'gif', 'webp']);
//   if (!ok) return res.status(400).json({ error: 'Type de fichier invalide.' });

const FileType = require('file-type');

// Extensions considérées comme "image" pour les besoins de la vérification.
// mime associé à chaque extension acceptée (file-type retourne l'extension
// ET le mime réel détecté depuis les octets).
//
// 🐛 CORRECTION : ajout des types audio (mp3, wav, ogg, oga) qui manquaient.
// Sans ces entrées, un mp3 valide était rejeté car EXTENSIONS_CONNUES['mp3']
// était undefined → mimeCoherent = false → ok = false → 400 Bad Request.
const EXTENSIONS_CONNUES = {
  jpg:  ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png:  ['image/png'],
  gif:  ['image/gif'],
  webp: ['image/webp'],
  pdf:  ['application/pdf'],
  mp4:  ['video/mp4'],
  webm: ['video/webm'],
  // Conteneur Ogg — file-type peut retourner l'une ou l'autre extension
  // selon ce qu'il détecte à l'intérieur (vidéo, audio, ou générique).
  ogg:  ['application/ogg', 'video/ogg', 'audio/ogg'],
  ogv:  ['video/ogg'],
  oga:  ['audio/ogg'],

  // ── Audio ──────────────────────────────────────────────────────────────
  // file-type retourne ext='mp3', mime='audio/mpeg' pour un MP3.
  // Note : "audio/mp3" n'existe pas officiellement, mais on l'accepte par
  // sécurité si un jour un fichier est mal détecté par une ancienne version
  // de file-type.
  mp3:  ['audio/mpeg', 'audio/mp3'],
  // WAV : file-type retourne ext='wav', mime='audio/x-wav' ou 'audio/wav'
  // selon la version. On accepte les deux.
  wav:  ['audio/x-wav', 'audio/wav', 'audio/vnd.wave'],
};

/**
 * Vérifie qu'un buffer correspond réellement à un des types autorisés,
 * en inspectant sa signature binaire (pas son nom ni son Content-Type).
 *
 * @param {Buffer} buffer - le contenu du fichier
 * @param {string[]} extensionsAutorisees - ex: ['jpg', 'png', 'webp']
 * @returns {Promise<{ok: boolean, extensionDetectee: string|null, mimeDetecte: string|null}>}
 */
async function verifierTypeFichier(buffer, extensionsAutorisees) {
  const detection = await FileType.fromBuffer(buffer);

  if (!detection) {
    // Aucune signature binaire reconnue — fichier vide, corrompu, ou
    // d'un type que file-type ne sait pas identifier (ex: un .txt brut
    // n'a pas de signature binaire). Par sécurité, on refuse.
    return { ok: false, extensionDetectee: null, mimeDetecte: null };
  }

  const { ext, mime } = detection;
  const attendus = EXTENSIONS_CONNUES[ext];
  const listeAutorisee = extensionsAutorisees.map(e => e.toLowerCase());

  // Famille Ogg : si l'appelant accepte 'ogg', on accepte aussi ce que
  // file-type détecte précisément à l'intérieur (ogv = vidéo, oga = audio).
  const OGG_FAMILLE = ['ogg', 'ogv', 'oga'];
  const extensionAcceptee = listeAutorisee.includes(ext)
    || (listeAutorisee.includes('ogg') && OGG_FAMILLE.includes(ext));

  // 🐛 CORRECTION : si 'mp3' est demandé, on accepte aussi 'mpeg' (certaines
  // versions de file-type retournent ext='mpeg' au lieu de 'mp3' selon le
  // fichier — MP3 avec tag ID3v2 par exemple).
  const extensionAlternative =
    (ext === 'mp3' && listeAutorisee.includes('mp3'))
    || (ext === 'mpeg' && listeAutorisee.includes('mp3'));

  const mimeCoherent = attendus && attendus.includes(mime);

  return {
    ok: (extensionAcceptee || extensionAlternative) && mimeCoherent,
    extensionDetectee: ext,
    mimeDetecte: mime,
  };
}

/**
 * Détecte si un fichier est un exécutable/script dangereux, en inspectant
 * ses vrais octets — peu importe le nom, l'extension ou le Content-Type
 * déclarés. Utile quand on ne peut pas vérifier positivement CHAQUE format
 * légitime (ex: une marketplace de produits numériques qui accepte PDF,
 * ZIP, MP3, DOCX...), mais qu'on veut quand même bloquer le cas où
 * quelqu'un renomme un virus en "facture.pdf".
 *
 * @param {Buffer} buffer
 * @returns {{dangereux: boolean, raison: string|null}}
 */
function verifierNonExecutable(buffer) {
  if (!buffer || buffer.length < 4) return { dangereux: false, raison: null };

  const b = buffer;

  // MZ — exécutable Windows (.exe, .dll)
  if (b[0] === 0x4D && b[1] === 0x5A) {
    return { dangereux: true, raison: 'exécutable Windows (MZ)' };
  }
  // \x7fELF — exécutable Linux
  if (b[0] === 0x7F && b[1] === 0x45 && b[2] === 0x4C && b[3] === 0x46) {
    return { dangereux: true, raison: 'exécutable Linux (ELF)' };
  }
  // Mach-O — exécutable macOS (32/64 bits, little/big endian, fat binary)
  const machO = [
    [0xFE, 0xED, 0xFA, 0xCE], [0xFE, 0xED, 0xFA, 0xCF],
    [0xCE, 0xFA, 0xED, 0xFE], [0xCF, 0xFA, 0xED, 0xFE],
    [0xCA, 0xFE, 0xBA, 0xBE],
  ];
  if (machO.some(sig => sig.every((byte, i) => b[i] === byte))) {
    return { dangereux: true, raison: 'exécutable macOS (Mach-O)' };
  }
  // #! — script shebang (Unix/Linux)
  if (b[0] === 0x23 && b[1] === 0x21) {
    return { dangereux: true, raison: 'script exécutable (shebang)' };
  }

  return { dangereux: false, raison: null };
}

module.exports = { verifierTypeFichier, verifierNonExecutable };