// src/services/emailService.js
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Initialiser le client SES avec vos clés
const sesClient = new SESClient({ 
  region: process.env.REACT_APP_AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY
  }
});

// Fonction pour remplacer les variables dans le template
function remplacerVariables(texte, variables) {
  let resultat = texte;
  Object.entries(variables).forEach(([cle, valeur]) => {
    const regex = new RegExp('\\{\\$' + cle + '\\}', 'g');
    resultat = resultat.replace(regex, valeur);
  });
  return resultat;
}

// Fonction principale d'envoi d'email
export async function envoyerEmail(template, destinataire, variables) {
  try {
    // Vérifier que le template a bien un sujet et un html
    if (!template || !template.sujet || !template.html) {
      throw new Error("Template invalide");
    }

    // Remplacer les variables dans le sujet et le HTML
    const sujetFinal = remplacerVariables(template.sujet, variables);
    let corpsFinal = remplacerVariables(template.html, variables);
    
    // Remplacer la date automatiquement
    const date = new Date().toLocaleDateString('fr-CA');
    corpsFinal = corpsFinal.replace(/\{\$date\}/g, date);

    console.log("📧 Préparation de l'email:", {
      sujet: sujetFinal,
      destinataire,
      variables
    });

    // Préparer la commande pour SES
    const command = new SendEmailCommand({
      Destination: { 
        ToAddresses: [destinataire] 
      },
      Message: {
        Subject: { Data: sujetFinal, Charset: "UTF-8" },
        Body: { 
          Html: { Data: corpsFinal, Charset: "UTF-8" },
          Text: { Data: "Version texte à générer", Charset: "UTF-8" } // optionnel
        }
      },
      Source: "evend.ca@outlook.com", // Votre adresse vérifiée
    });

    // Envoyer l'email
    const result = await sesClient.send(command);
    console.log("✅ Email envoyé! MessageId:", result.MessageId);
    return { success: true, messageId: result.MessageId };
    
  } catch (error) {
    console.error("❌ Erreur d'envoi:", error);
    return { success: false, error: error.message };
  }
}
