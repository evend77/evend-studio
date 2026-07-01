/**
 * CommandeDetail.tsx
 * src/pages/acheteur/CommandeDetail.tsx
 */

import React, { useState, useEffect } from 'react';

const API = 'https://evend-multivendeur-api.onrender.com';

// Types
interface Produit {
  nom: string;
  quantite: number;
  prix: string;
  sku?: string;
  image?: string;
}

interface EvenementHistorique {
  date: string;
  statut: string;
  description: string;
  etape: string;
}

interface Commande {
  id: number;
  commande_id: string;
  statut: string;
  date: string;
  total: string;
  montant: number;
  articles: Produit[];
  destinataire?: string;
  adresseLivraison?: string;
  adresseFacturation?: string;
  numeroSuivi?: string;
  transporteur?: string;
  vendeur_id: number;
  vendeur_nom?: string;
  vendeur_boutique?: string;
  nomClient?: string;
  emailClient?: string;
  modeExpedition?: string;
  dateExpedition?: string;
  dateLivraisonPrevue?: string;
  historique_suivi?: EvenementHistorique[];
  sousTotal?: string;
  fraisExpedition?: string;
  tps?: string;
  tvq?: string;
  totalFinal?: string;
  numeroFacture?: string;
  methodePaiement?: string;
  noteCommande?: string;
}

interface CommandeDetailProps {
  commande?: Commande;
  onBack: () => void;
}

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
  border: 'rgba(255,255,255,0.08)',
  textLight: 'rgba(255,255,255,0.5)',
};

// Badge de statut
const StatutBadge = ({ statut }: { statut: string }) => {
  let config = { bg: C.blueLight, color: C.blue, icon: '📦' };
  
  if (statut === 'Livrée' || statut === 'Livré') config = { bg: C.greenLight, color: C.green, icon: '✅' };
  if (statut === 'Annulée' || statut === 'Annulé') config = { bg: C.redLight, color: C.red, icon: '❌' };
  if (statut === 'Préparation pour expédition') config = { bg: C.yellowLight, color: C.yellow, icon: '⚙️' };
  if (statut === 'En attente') config = { bg: C.yellowLight, color: C.yellow, icon: '⏳' };
  if (statut === 'Confirmée') config = { bg: C.blueLight, color: C.blue, icon: '✅' };
  if (statut === 'Partiellement livrée') config = { bg: C.purpleLight, color: C.purple, icon: '📦' };
  
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '11px',
      fontWeight: 700,
      padding: '4px 10px',
      borderRadius: '20px',
      background: config.bg,
      color: config.color,
      border: `1px solid ${config.color}40`,
    }}>
      {config.icon} {statut}
    </span>
  );
};

export default function CommandeDetail({ commande, onBack }: CommandeDetailProps) {
  const [adressePrincipale, setAdressePrincipale] = useState<string>('');
  const [loadingAdresse, setLoadingAdresse] = useState(false);
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Charger l'adresse principale de l'acheteur
  useEffect(() => {
    const fetchAdressePrincipale = async () => {
      if (!user?.id) return;
      
      setLoadingAdresse(true);
      try {
        const response = await fetch(`${API}/api/acheteurs/${user.id}/adresses`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const adresses = await response.json();
          const principale = adresses.find((a: any) => a.est_principale) || adresses[0];
          
          if (principale) {
            const adresseFormatted = [
              principale.ligne1,
              principale.ligne2,
              principale.ville,
              principale.province,
              principale.code_postal,
              principale.pays
            ].filter(Boolean).join(', ');
            
            setAdressePrincipale(adresseFormatted || 'Adresse non spécifiée');
          } else {
            setAdressePrincipale('Aucune adresse enregistrée');
          }
        }
      } catch (error) {
        console.error('Erreur chargement adresse:', error);
        setAdressePrincipale('Erreur de chargement');
      } finally {
        setLoadingAdresse(false);
      }
    };

    fetchAdressePrincipale();
  }, [user?.id, token]);

  if (!commande) {
    return (
      <div style={{ 
        padding: '60px 20px', 
        textAlign: 'center',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '20px',
        border: `1px dashed ${C.border}`,
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📭</div>
        <p style={{ color: '#fff', fontSize: '16px', marginBottom: '20px' }}>Commande non trouvée</p>
        <button 
          onClick={onBack} 
          style={{ 
            padding: '10px 20px', 
            background: C.blue, 
            color: '#fff', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          ← Retour aux commandes
        </button>
      </div>
    );
  }

  const imprimerFacture = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      // Générer une facture simplifiée
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Facture ${commande.commande_id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #3b82f6; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #3b82f6; color: white; padding: 10px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #ddd; }
            .total { font-weight: bold; font-size: 18px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Facture ${commande.commande_id}</h1>
          <p>Date: ${commande.date}</p>
          <table>
            <tr>
              <th>Produit</th>
              <th>Qté</th>
              <th>Prix</th>
            </tr>
            ${commande.articles.map(a => `
              <tr>
                <td>${a.nom}</td>
                <td>${a.quantite}</td>
                <td>${a.prix}</td>
              </tr>
            `).join('')}
          </table>
          <div class="total">Total: ${commande.total}</div>
        </body>
        </html>
      `;
      
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <div style={{ animation: 'fadeUp 0.5s ease' }}>
      {/* Bouton retour */}
      <button 
        onClick={onBack} 
        style={{ 
          marginBottom: '24px', 
          padding: '8px 16px', 
          background: 'rgba(255,255,255,0.05)', 
          border: `1px solid ${C.border}`, 
          borderRadius: '8px', 
          color: '#fff', 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
      >
        ← Retour
      </button>

      {/* En-tête */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontFamily: "'Sora', sans-serif", fontWeight: 800, color: '#fff' }}>
          Détail de la commande {commande.commande_id || commande.id}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <p style={{ margin: 0, fontSize: '14px', color: C.textLight }}>
            {commande.date}
          </p>
          {commande.vendeur_boutique && (
            <p style={{ margin: 0, fontSize: '14px', color: C.textLight }}>
              Vendu par: <span style={{ color: C.blue, fontWeight: 600 }}>{commande.vendeur_boutique}</span>
            </p>
          )}
        </div>
      </div>

      {/* Grille principale */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Colonne de gauche - Articles */}
        <div>
          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: `1px solid ${C.border}`, 
            borderRadius: '20px', 
            padding: '24px',
            marginBottom: '20px',
          }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700, color: '#fff', fontFamily: "'Sora', sans-serif" }}>
              🛒 Articles commandés
            </h3>
            
            {commande.articles && commande.articles.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {commande.articles.map((article, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '14px', 
                      paddingBottom: '12px', 
                      borderBottom: index < (commande.articles?.length || 0) - 1 ? `1px solid ${C.border}` : 'none' 
                    }}
                  >
                    <div style={{ 
                      width: '50px', 
                      height: '50px', 
                      borderRadius: '10px', 
                      background: 'rgba(255,255,255,0.05)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '24px' 
                    }}>
                      {article.image ? (
                        <img src={article.image} alt={article.nom} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '10px' }} />
                      ) : '📦'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: '#fff' }}>{article.nom}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: C.textLight }}>Quantité: {article.quantite}</p>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{article.prix}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: C.textLight, textAlign: 'center', padding: '20px' }}>
                Aucun détail produit disponible
              </p>
            )}
          </div>

          {/* Section Timeline d'historique */}
          {commande.historique_suivi && commande.historique_suivi.length > 0 && (
            <div style={{ 
              background: 'rgba(255,255,255,0.03)', 
              border: `1px solid ${C.border}`, 
              borderRadius: '20px', 
              padding: '24px',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700, color: '#fff', fontFamily: "'Sora', sans-serif" }}>
                📜 Suivi de commande
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {commande.historique_suivi.map((event, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ 
                      minWidth: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: C.blue,
                      marginTop: '6px'
                    }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                        {event.statut || 'Mise à jour'}
                      </p>
                      <p style={{ margin: '0 0 2px', fontSize: '12px', color: C.textLight }}>
                        {event.description}
                      </p>
                      <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
                        {new Date(event.date).toLocaleString('fr-CA', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suivi de commande (si disponible) */}
          {commande.numeroSuivi && (
            <div style={{ 
              background: 'rgba(255,255,255,0.03)', 
              border: `1px solid ${C.border}`, 
              borderRadius: '20px', 
              padding: '24px' 
            }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700, color: '#fff', fontFamily: "'Sora', sans-serif" }}>
                📦 Suivi de livraison
              </h3>
              <p style={{ color: '#fff', fontSize: '14px', marginBottom: '8px' }}>
                Numéro de suivi: <span style={{ color: C.blue, fontWeight: 600 }}>{commande.numeroSuivi}</span>
              </p>
              {commande.transporteur && (
                <p style={{ color: C.textLight, fontSize: '12px', marginBottom: '8px' }}>
                  Transporteur: {commande.transporteur}
                </p>
              )}
              <p style={{ color: C.textLight, fontSize: '12px' }}>
                Dernière mise à jour: {commande.date}
              </p>
            </div>
          )}
        </div>

        {/* Colonne de droite - Résumé */}
        <div>
          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: `1px solid ${C.border}`, 
            borderRadius: '20px', 
            padding: '24px',
            position: 'sticky',
            top: '84px',
          }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700, color: '#fff', fontFamily: "'Sora', sans-serif" }}>
              📋 Résumé
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: C.textLight, fontSize: '13px' }}>N° commande</span>
                <span style={{ color: '#fff', fontWeight: 600, fontSize: '13px' }}>{commande.commande_id || commande.id}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: C.textLight, fontSize: '13px' }}>Date</span>
                <span style={{ color: '#fff', fontWeight: 600, fontSize: '13px' }}>{commande.date}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: C.textLight, fontSize: '13px' }}>Statut</span>
                <StatutBadge statut={commande.statut} />
              </div>
              
              {commande.destinataire && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: C.textLight, fontSize: '13px' }}>Destinataire</span>
                  <span style={{ color: '#fff', fontWeight: 600, fontSize: '13px' }}>{commande.destinataire}</span>
                </div>
              )}
              
              {/* Adresse de livraison - soit celle de la commande, soit l'adresse principale */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: C.textLight, fontSize: '13px' }}>Adresse de livraison</span>
                <span style={{ color: '#fff', fontSize: '13px', lineHeight: 1.5 }}>
                  {loadingAdresse ? 'Chargement...' : 
                   commande.adresseLivraison || adressePrincipale || 'Non spécifiée'}
                </span>
              </div>
              
              {commande.modeExpedition && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: C.textLight, fontSize: '13px' }}>Mode d'expédition</span>
                  <span style={{ color: '#fff', fontWeight: 600, fontSize: '13px' }}>{commande.modeExpedition}</span>
                </div>
              )}
              
              {commande.methodePaiement && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: C.textLight, fontSize: '13px' }}>Paiement</span>
                  <span style={{ color: '#fff', fontWeight: 600, fontSize: '13px' }}>{commande.methodePaiement}</span>
                </div>
              )}
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginTop: '10px', 
                paddingTop: '14px', 
                borderTop: `1px solid ${C.border}` 
              }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>Total</span>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: '18px' }}>{commande.total}</span>
              </div>
            </div>

            {/* Boutons d'action */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}>
              <button 
                onClick={imprimerFacture}
                style={{ 
                  width: '100%', 
                  background: `linear-gradient(135deg, ${C.blue}, #1e40af)`, 
                  border: 'none', 
                  borderRadius: '12px', 
                  color: '#fff', 
                  padding: '14px', 
                  fontSize: '14px', 
                  fontWeight: 700, 
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                📄 Télécharger la facture
              </button>
              
              {(commande.statut === 'Préparation pour expédition' || commande.statut === 'En attente') && (
                <button 
                  style={{ 
                    width: '100%', 
                    background: 'rgba(239,68,68,0.1)', 
                    border: `1px solid ${C.red}40`, 
                    borderRadius: '12px', 
                    color: C.red, 
                    padding: '14px', 
                    fontSize: '14px', 
                    fontWeight: 700, 
                    cursor: 'pointer',
                  }}
                >
                  🔄 Annuler la commande
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
