// src/utils/taxes.ts
// Fonctions de calcul des taxes selon la province

export interface TaxResult {
  tps: number;
  tvq: number;
  tvh: number;
  totalTaxes: number;
}

export function calculerTaxes(montant: number, province: string = 'QC', regimeVendeur: string = 'particulier'): TaxResult {
  let tps = 0;
  let tvq = 0;
  let tvh = 0;
  
  // TPS (5% partout au Canada) sauf pour les provinces à TVH
  if (!['ON', 'NB', 'NS', 'NL', 'PE', 'BC'].includes(province)) {
    tps = montant * 0.05;
  }
  
  // Selon la province
  switch(province) {
    case 'QC': // Québec
      tvq = montant * 0.09975; // 9.975%
      break;
      
    case 'ON': // Ontario
    case 'NB': // Nouveau-Brunswick
    case 'NS': // Nouvelle-Écosse
    case 'NL': // Terre-Neuve
    case 'PE': // Île-du-Prince-Édouard
      tvh = montant * 0.15; // 15% pour ces provinces
      break;
      
    case 'BC': // Colombie-Britannique
      tvh = montant * 0.12; // 12% (PST + GST)
      break;
      
    // Autres provinces : seulement TPS
    default:
      // tps déjà calculée
      break;
  }
  
  return {
    tps: Math.round(tps * 100) / 100,
    tvq: Math.round(tvq * 100) / 100,
    tvh: Math.round(tvh * 100) / 100,
    totalTaxes: Math.round((tps + tvq + tvh) * 100) / 100
  };
}

export function formaterMontant(montant: number): string {
  return montant.toFixed(2) + ' $';
}
