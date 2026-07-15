// cleanup_photos_test.js
// Script ponctuel — supprime les lignes de test id 3, 4, 5 de sponsor_photos
// ET les fichiers S3 correspondants.
// Usage : node cleanup_photos_test.js   (à rouler depuis la racine du projet, là où se trouve db.js)

const pool = require('./db');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const IDS_A_SUPPRIMER = [3, 4, 5];

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const BUCKET_NAME = process.env.AWS_S3_BUCKET_SPONSOR || 'evend-studio-sponsors-2026-296886269853-us-east-1-an';

async function deleteFromS3(url) {
  if (!url) return;
  const baseUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/`;
  if (!url.startsWith(baseUrl)) {
    console.log(`  ⚠️  URL inattendue, skip S3 : ${url}`);
    return;
  }
  const key = url.replace(baseUrl, '');
  await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
  console.log(`  🗑️  Fichier S3 supprimé : ${key}`);
}

(async () => {
  try {
    for (const id of IDS_A_SUPPRIMER) {
      const check = await pool.query('SELECT id, url_image FROM sponsor_photos WHERE id = $1', [id]);
      if (check.rows.length === 0) {
        console.log(`Id ${id} : déjà absent, skip.`);
        continue;
      }
      console.log(`Id ${id} : suppression en cours...`);
      await deleteFromS3(check.rows[0].url_image);
      await pool.query('DELETE FROM sponsor_photos WHERE id = $1', [id]);
      console.log(`  ✅ Ligne BD supprimée (id ${id})`);
    }
    console.log('\n✅ Nettoyage terminé.');
  } catch (error) {
    console.error('❌ Erreur pendant le nettoyage:', error);
  } finally {
    await pool.end();
  }
})();