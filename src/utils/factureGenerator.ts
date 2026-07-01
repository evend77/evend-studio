/**
 * factureGenerator.ts
 * Utilitaire centralisé pour générer le HTML des factures
 */

export const toNumber = (val: any): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/,/g, '.').replace(/\s/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export const getLignesArray = (lignes: any): any[] => {
  if (!lignes) return [];
  if (Array.isArray(lignes)) return lignes;
  if (typeof lignes === 'string') {
    try {
      const parsed = JSON.parse(lignes);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Erreur parsing lignes:', e);
      return [];
    }
  }
  return [];
};

export const genererHTMLFactureDepuisFacture = (facture: any): string => {
  
  console.log('📄 Génération HTML pour facture:', facture.numero_facture);
  
  // Récupérer les lignes
  const lignesArray = getLignesArray(facture.lignes);
  console.log('📦 Lignes extraites:', lignesArray);

  // Générer les lignes du tableau HTML
  const lignesProduits = lignesArray.map((ligne: any) => {
    const prixUnitaire = toNumber(ligne.prix_unitaire);
    const totalLigne = toNumber(ligne.total_ligne);
    const quantite = toNumber(ligne.quantite) || 1;
    
    return `
      <tr>
        <td style="padding: 12px; border: 1px solid #e1e4e8;">${ligne.produit_nom || 'Produit'}</td>
        <td style="padding: 12px; border: 1px solid #e1e4e8;">${ligne.sku || ligne.produit_sku || 'N/A'}</td>
        <td style="padding: 12px; text-align: center; border: 1px solid #e1e4e8;">${quantite}</td>
        <td style="padding: 12px; text-align: right; border: 1px solid #e1e4e8;">${prixUnitaire.toFixed(2)} $</td>
        <td style="padding: 12px; text-align: right; font-weight: 700; border: 1px solid #e1e4e8;">${totalLigne.toFixed(2)} $</td>
      </tr>
    `;
  }).join('') || '';

  const tableBody = lignesProduits || `
    <tr>
      <td colspan="5" style="text-align:center; padding:20px; color:#999; border: 1px solid #e1e4e8;">
        Aucun détail de produit disponible
      </td>
    </tr>
  `;

  const sousTotal = toNumber(facture.sous_total);
  const fraisExpedition = toNumber(facture.frais_expedition);
  const tps = toNumber(facture.tps);
  const tvq = toNumber(facture.tvq);
  const tvh = toNumber(facture.tvh);
  const pourboire = toNumber(facture.pourboire);
  const total = toNumber(facture.total);

  return `
<div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a2332; background: white; padding: 30px;">
  
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #3b82f6;">
    <div style="font-size: 24px; font-weight: 900; color: #3b82f6; letter-spacing: -0.5px;">e-Vend<span style="color:#8b5cf6;">.ca</span></div>
    <div style="text-align: right;">
      <h1 style="font-size: 28px; font-weight: 900; color: #3b82f6; margin:0;">Facture</h1>
      <div style="font-size: 14px; color: #6b7280;">N° ${facture.numero_facture}</div>
    </div>
  </div>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px;">
    <div style="background: #f8fafc; border-radius: 10px; padding: 16px 20px; border-left: 4px solid #3b82f6;">
      <h3 style="font-size: 10px; font-weight: 800; color: #3b82f6; text-transform: uppercase; letter-spacing: 1px; margin:0 0 10px 0;">Vendu par</h3>
      <p style="font-size: 13px; color: #374151; line-height:1.7; margin:0;">
        <strong style="font-size: 15px; color: #1a2332;">${facture.vendeur_boutique || facture.vendeur_nom || 'Vendeur'}</strong><br>
        Via e-Vend.ca
      </p>
    </div>
    <div style="background: #f8fafc; border-radius: 10px; padding: 16px 20px; border-left: 4px solid #8b5cf6;">
      <h3 style="font-size: 10px; font-weight: 800; color: #3b82f6; text-transform: uppercase; letter-spacing: 1px; margin:0 0 10px 0;">Facturé à</h3>
      <p style="font-size: 13px; color: #374151; line-height:1.7; margin:0;">
        <strong style="font-size: 15px; color: #1a2332;">${facture.acheteur_nom || 'Client'}</strong><br>
        ${facture.acheteur_email || ''}<br>
        ${facture.acheteur_adresse || ''}
      </p>
    </div>
  </div>

  <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px;">
    <div style="background: #eff6ff; border-radius: 8px; padding: 12px 14px; text-align: center;">
      <div style="font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">N° Commande</div>
      <div style="font-size: 13px; font-weight: 800; color: #1a2332; margin-top:3px;">${facture.numero_commande || facture.commande_id || ''}</div>
    </div>
    <div style="background: #eff6ff; border-radius: 8px; padding: 12px 14px; text-align: center;">
      <div style="font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Date commande</div>
      <div style="font-size: 13px; font-weight: 800; color: #1a2332; margin-top:3px;">${facture.date_commande_fr || facture.date_commande || ''}</div>
    </div>
    <div style="background: #eff6ff; border-radius: 8px; padding: 12px 14px; text-align: center;">
      <div style="font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Date facture</div>
      <div style="font-size: 13px; font-weight: 800; color: #1a2332; margin-top:3px;">${facture.date_emission_fr || new Date(facture.date_emission).toLocaleDateString('fr-CA')}</div>
    </div>
    <div style="background: #eff6ff; border-radius: 8px; padding: 12px 14px; text-align: center;">
      <div style="font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Livraison</div>
      <div style="font-size: 13px; font-weight: 800; color: #1a2332; margin-top:3px;">${facture.mode_expedition || 'Standard'}</div>
    </div>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <thead>
      <tr style="background: #3b82f6; color: white;">
        <th style="padding: 11px 14px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Produit</th>
        <th style="padding: 11px 14px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">SKU</th>
        <th style="padding: 11px 14px; text-align: center; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Qté</th>
        <th style="padding: 11px 14px; text-align: right; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Prix unit.</th>
        <th style="padding: 11px 14px; text-align: right; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${tableBody}
    </tbody>
  </table>

  <div style="width: 300px; margin-left: auto; margin-bottom: 28px;">
    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e1e4e8; font-size: 13px;">
      <span>Sous-total</span>
      <span>${sousTotal.toFixed(2)} $</span>
    </div>
    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e1e4e8; font-size: 13px;">
      <span>Frais d'expédition</span>
      <span>${fraisExpedition.toFixed(2)} $</span>
    </div>
    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e1e4e8; font-size: 13px;">
      <span>TPS (5%)</span>
      <span>${tps.toFixed(2)} $</span>
    </div>
    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e1e4e8; font-size: 13px;">
      <span>TVQ (9.975%)</span>
      <span>${tvq.toFixed(2)} $</span>
    </div>
    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e1e4e8; font-size: 13px;">
      <span>TVH</span>
      <span>${tvh.toFixed(2)} $</span>
    </div>
    ${pourboire > 0 ? `
    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e1e4e8; font-size: 13px;">
      <span>Pourboire</span>
      <span>${pourboire.toFixed(2)} $</span>
    </div>
    ` : ''}
    <div style="display: flex; justify-content: space-between; background: #3b82f6; color: white; padding: 12px 14px; border-radius: 8px; font-size: 15px; font-weight: 900; margin-top: 8px;">
      <span>TOTAL</span>
      <span>${total.toFixed(2)} $</span>
    </div>
  </div>

  <div style="margin-bottom:20px; font-size:12px; color:#374151;">
    <strong>Adresse de livraison :</strong> ${facture.acheteur_adresse || ''}<br>
    <strong>Paiement :</strong> ${facture.methode_paiement || 'Carte de crédit'}
    <span style="display:inline-block; background:#dcfce7; color:#16a34a; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:700; margin-left:8px;">PAYÉ</span>
  </div>

  ${facture.notes ? `
  <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:12px 16px; margin-bottom:20px; font-size:12px;">
    <strong>📝 Note :</strong> ${facture.notes}
  </div>
  ` : ''}

  <div style="margin-top: 32px; padding-top: 20px; border-top: 2px solid #e1e4e8; display: flex; justify-content: space-between; align-items: flex-end;">
    <div style="font-size: 14px; font-weight: 700; color: #3b82f6;">Merci pour votre achat sur e-Vend.ca ! 🎉</div>
    <div style="font-size: 11px; color: #6b7280; max-width: 400px; line-height: 1.5;">
      Note fiscale : Les taxes (TPS/TVQ/TVH) sont applicables selon le statut fiscal du vendeur et la province de l'acheteur.
    </div>
  </div>
</div>
`;
};
