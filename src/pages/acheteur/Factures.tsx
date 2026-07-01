/**
 * Factures.tsx
 * src/pages/acheteur/Factures.tsx
 * Page des factures pour l'acheteur - Version centralisée
 */

import React, { useState } from 'react';
import FacturePopup from '../../components/FacturePopup';

// DONNÉES FICTIVES DES FACTURES (adaptées au format du générateur)
const FACTURES_MOCK = [
  { 
    id: 1016,
    numero_facture: 'FAC-2026-1016',
    numero_commande: '#1016',
    date_commande_fr: '21 févr. 2026',
    date_emission_fr: '21 févr. 2026',
    total: 1.00,
    sous_total: 1.00,
    tps: 0.00,
    tvq: 0.00,
    tvh: 0.00,
    pourboire: 0.00,
    frais_expedition: 0.00,
    vendeur_boutique: 'super mag',
    vendeur_nom: 'alex',
    acheteur_nom: 'Louis Alexandre Bossé',
    acheteur_email: 'alex.bosse@hotmail.com',
    acheteur_adresse: '117 chemin de la Seigneurie, SAINT-ARSÈNE, Québec G0L 2K0, Canada',
    mode_expedition: 'Expédition gratuite',
    methode_paiement: 'Carte de crédit',
    lignes: [
      { produit_nom: 'Porte-clés personnalisé', sku: 'SKU001', quantite: 1, prix_unitaire: 1.00, total_ligne: 1.00 }
    ]
  },
  { 
    id: 1015,
    numero_facture: 'FAC-2026-1015',
    numero_commande: '#1015',
    date_commande_fr: '21 févr. 2026',
    date_emission_fr: '21 févr. 2026',
    total: 1.00,
    sous_total: 1.00,
    tps: 0.00,
    tvq: 0.00,
    tvh: 0.00,
    pourboire: 0.00,
    frais_expedition: 0.00,
    vendeur_boutique: 'super mag',
    vendeur_nom: 'alex',
    acheteur_nom: 'Louis Alexandre Bossé',
    acheteur_email: 'alex.bosse@hotmail.com',
    acheteur_adresse: '117 chemin de la Seigneurie, SAINT-ARSÈNE, Québec G0L 2K0, Canada',
    mode_expedition: 'Expédition gratuite',
    methode_paiement: 'Carte de crédit',
    lignes: [
      { produit_nom: 'Bracelet en cuir', sku: 'SKU002', quantite: 1, prix_unitaire: 1.00, total_ligne: 1.00 }
    ]
  },
  { 
    id: 1012,
    numero_facture: 'FAC-2026-1012',
    numero_commande: '#1012',
    date_commande_fr: '10 févr. 2026',
    date_emission_fr: '10 févr. 2026',
    total: 11.50,
    sous_total: 10.00,
    tps: 0.50,
    tvq: 1.00,
    tvh: 0.00,
    pourboire: 0.00,
    frais_expedition: 0.00,
    vendeur_boutique: 'super mag',
    vendeur_nom: 'alex',
    acheteur_nom: 'Louis Alexandre Bossé',
    acheteur_email: 'alex.bosse@hotmail.com',
    acheteur_adresse: '117 chemin de la Seigneurie, SAINT-ARSÈNE, Québec G0L 2K0, Canada',
    mode_expedition: 'Expédition gratuite',
    methode_paiement: 'Carte de crédit',
    lignes: [
      { produit_nom: '101 70s Hits CD', sku: 'SKU003', quantite: 1, prix_unitaire: 10.00, total_ligne: 10.00 }
    ]
  },
  { 
    id: 1011,
    numero_facture: 'FAC-2026-1011',
    numero_commande: '#1011',
    date_commande_fr: '19 janv. 2026',
    date_emission_fr: '19 janv. 2026',
    total: 10.00,
    sous_total: 10.00,
    tps: 0.00,
    tvq: 0.00,
    tvh: 0.00,
    pourboire: 0.00,
    frais_expedition: 0.00,
    vendeur_boutique: 'super mag',
    vendeur_nom: 'alex',
    acheteur_nom: 'Louis Alexandre Bossé',
    acheteur_email: 'alex.bosse@hotmail.com',
    acheteur_adresse: '117 chemin de la Seigneurie, SAINT-ARSÈNE, Québec G0L 2K0, Canada',
    mode_expedition: 'Expédition gratuite',
    methode_paiement: 'PayPal',
    lignes: [
      { produit_nom: 'Bonnet en laine', sku: 'SKU004', quantite: 1, prix_unitaire: 10.00, total_ligne: 10.00 }
    ]
  },
  { 
    id: 1008,
    numero_facture: 'FAC-2026-1008',
    numero_commande: '#1008',
    date_commande_fr: '5 janv. 2026',
    date_emission_fr: '5 janv. 2026',
    total: 34.59,
    sous_total: 23.99,
    frais_expedition: 5.00,
    tps: 1.20,
    tvq: 2.40,
    tvh: 0.00,
    pourboire: 2.00,
    vendeur_boutique: 'super mag',
    vendeur_nom: 'alex',
    acheteur_nom: 'Louis Alexandre Bossé',
    acheteur_email: 'alex.bosse@hotmail.com',
    acheteur_adresse: '456 rue des Lilas, Québec, QC G1V 2M2, Canada',
    mode_expedition: 'Livraison express',
    methode_paiement: 'PayPal',
    lignes: [
      { produit_nom: 'Bougie parfumée vanille', sku: 'SKU005', quantite: 1, prix_unitaire: 15.99, total_ligne: 15.99 },
      { produit_nom: 'Porte-clés métal', sku: 'SKU006', quantite: 1, prix_unitaire: 10.00, total_ligne: 10.00 }
    ]
  },
  { 
    id: 1005,
    numero_facture: 'FAC-2025-1005',
    numero_commande: '#1005',
    date_commande_fr: '28 déc. 2025',
    date_emission_fr: '28 déc. 2025',
    total: 42.50,
    sous_total: 42.50,
    tps: 0.00,
    tvq: 0.00,
    tvh: 0.00,
    pourboire: 0.00,
    frais_expedition: 0.00,
    vendeur_boutique: 'super mag',
    vendeur_nom: 'alex',
    acheteur_nom: 'Louis Alexandre Bossé',
    acheteur_email: 'alex.bosse@hotmail.com',
    acheteur_adresse: '456 rue des Lilas, Québec, QC G1V 2M2, Canada',
    mode_expedition: 'Expédition gratuite',
    methode_paiement: 'Carte de crédit',
    lignes: [
      { produit_nom: 'Écharpe en cachemire', sku: 'SKU007', quantite: 1, prix_unitaire: 29.99, total_ligne: 29.99 },
      { produit_nom: 'Bonnet en laine', sku: 'SKU008', quantite: 1, prix_unitaire: 12.51, total_ligne: 12.51 }
    ]
  },
];

// Couleurs
const C = {
  blue: '#3b82f6',
  blueLight: 'rgba(59,130,246,0.15)',
  green: '#10b981',
  greenLight: 'rgba(16,185,129,0.15)',
  yellow: '#f59e0b',
  yellowLight: 'rgba(245,158,11,0.15)',
  red: '#ef4444',
  redLight: 'rgba(239,68,68,0.15)',
  purple: '#8b5cf6',
  purpleLight: 'rgba(139,92,246,0.15)',
  indigo: '#6366f1',
  indigoLight: 'rgba(99,102,241,0.15)',
  border: 'rgba(255,255,255,0.08)',
  textLight: 'rgba(255,255,255,0.5)',
  cardBg: 'rgba(255,255,255,0.03)',
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
export default function Factures() {  // ← plus de props
  const [recherche, setRecherche] = useState('');
  const [facturePopup, setFacturePopup] = useState<any>(null);

  // Statistiques
  const totalFactures = FACTURES_MOCK.length;
  const montantTotal = FACTURES_MOCK.reduce((acc, f) => acc + f.total, 0).toFixed(2);
  const facturesPayees = FACTURES_MOCK.length; // Toutes sont payées
  const dernierMois = 'Février 2026';

  const facturesFiltrees = FACTURES_MOCK.filter(f => 
    f.numero_facture.toLowerCase().includes(recherche.toLowerCase()) ||
    f.numero_commande.toLowerCase().includes(recherche.toLowerCase()) ||
    f.date_commande_fr.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <>
      <div style={{ animation: 'fadeUp 0.5s ease' }}>
        {/* En-tête avec statistiques */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '24px',
          padding: '32px',
          marginBottom: '32px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: '-30px',
            right: '-30px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-50px',
            left: '-50px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }} />
          
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
              <span style={{ fontSize: '40px' }}>🧾</span>
              <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 800, color: '#fff', fontFamily: "'Sora', sans-serif" }}>
                Mes factures
              </h1>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: '16px', color: 'rgba(255,255,255,0.8)', maxWidth: '500px' }}>
              Consultez et téléchargez toutes vos factures en un seul endroit.
            </p>
            
            {/* Statistiques rapides */}
            <div style={{ display: 'flex', gap: '40px' }}>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{totalFactures}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Total factures</div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{montantTotal} $</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Montant total</div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{facturesPayees}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Payées</div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{dernierMois}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Dernier mois</div>
              </div>
            </div>
          </div>
        </div>

        {/* Barre de recherche */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <input
            type="text"
            placeholder="🔍 Rechercher par numéro de facture ou commande..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '12px 16px',
              borderRadius: '30px',
              border: `1px solid ${C.border}`,
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>

        {/* Liste des factures */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {facturesFiltrees.length === 0 ? (
            <div style={{ 
              padding: '60px', 
              textAlign: 'center', 
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '20px',
              border: `1px dashed ${C.border}`,
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📭</div>
              <p style={{ color: '#fff', fontSize: '16px', marginBottom: '8px' }}>Aucune facture trouvée</p>
              <p style={{ color: C.textLight, fontSize: '13px' }}>Essayez de modifier votre recherche</p>
            </div>
          ) : (
            facturesFiltrees.map((facture) => (
              <div
                key={facture.id}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${C.border}`,
                  borderRadius: '16px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              >
                {/* Info facture */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: C.greenLight,
                    border: `1px solid ${C.green}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    color: C.green,
                  }}>
                    🧾
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff', fontFamily: "'Sora', sans-serif" }}>
                        {facture.numero_facture}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: C.greenLight,
                        color: C.green,
                      }}>
                        Payée
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', color: C.textLight }}>
                        Commande {facture.numero_commande}
                      </span>
                      <span style={{ fontSize: '12px', color: C.textLight }}>
                        📅 {facture.date_commande_fr}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                        {facture.total.toFixed(2)} $
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bouton Voir facture */}
                <button
                  onClick={() => setFacturePopup(facture)}
                  style={{
                    padding: '8px 16px',
                    background: C.greenLight,
                    border: `1px solid ${C.green}40`,
                    borderRadius: '8px',
                    color: C.green,
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  🖨️ Voir facture
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Popup de facture centralisé */}
      {facturePopup && (
        <FacturePopup 
          facture={facturePopup}
          onClose={() => setFacturePopup(null)} 
        />
      )}
    </>
  );
}
