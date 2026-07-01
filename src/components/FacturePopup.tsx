/**
 * FacturePopup.tsx
 * src/components/FacturePopup.tsx
 * Composant réutilisable pour afficher une facture
 */

import React, { useState, useEffect } from 'react';
import { genererHTMLFactureDepuisFacture } from '../utils/factureGenerator';

const API = 'https://evend-multivendeur-api.onrender.com';

const C = {
  blue: '#3b82f6',
  red: '#ef4444',
};

interface FacturePopupProps {
  commandeId?: number;        // Mode BD : on va chercher la facture
  facture?: any;              // Mode mock : on utilise les données directement
  onClose: () => void;
}

export default function FacturePopup({ commandeId, facture: factureMock, onClose }: FacturePopupProps) {
  const [facture, setFacture] = useState<any>(null);
  const [loading, setLoading] = useState(!factureMock); // Pas de loading si on a déjà la facture
  const [error, setError] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const chargerFacture = async () => {
      // Si on a déjà la facture (mode mock), on génère directement
      if (factureMock) {
        console.log('📦 Utilisation facture mock:', factureMock);
        setFacture(factureMock);
        const html = genererHTMLFactureDepuisFacture(factureMock);
        setHtmlContent(html);
        setLoading(false);
        return;
      }

      // Sinon, on va chercher dans la BD (mode réel)
      if (!commandeId) return;
      
      setLoading(true);
      
      try {
        // 1. Vérifier si une facture existe déjà
        const url1 = `${API}/api/commandes/${commandeId}/factures`;
        let response = await fetch(url1, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error(`Erreur ${response.status}`);
        
        let factures = await response.json();
        let factureId: number;
        
        if (factures.length > 0) {
          factureId = factures[0].id;
        } else {
          // Créer une nouvelle facture
          const url2 = `${API}/api/commandes/${commandeId}/facture`;
          const createResponse = await fetch(url2, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!createResponse.ok) throw new Error('Erreur création facture');
          
          const newFacture = await createResponse.json();
          factureId = newFacture.id;
        }
        
        // 2. Récupérer la facture complète
        const url3 = `${API}/api/factures/${factureId}`;
        const factureResponse = await fetch(url3, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!factureResponse.ok) throw new Error('Erreur chargement facture');
        
        const factureData = await factureResponse.json();
        setFacture(factureData);
        
        // 3. Générer le HTML
        const html = genererHTMLFactureDepuisFacture(factureData);
        setHtmlContent(html);
        
      } catch (err) {
        console.error('❌ Erreur chargement facture:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    chargerFacture();
  }, [commandeId, factureMock, token]);

  const imprimerFacture = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && htmlContent) {
      printWindow.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Facture</title></head><body>' + htmlContent + '</body></html>');
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(5px)',
      }}>
        <div style={{
          background: '#1a1f2e',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center',
        }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(59,130,246,0.3)', borderTop: `3px solid ${C.blue}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#fff' }}>Génération de la facture...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(5px)',
      }} onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div style={{
          background: '#1a1f2e',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '400px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <p style={{ color: C.red, marginBottom: '20px' }}>{error}</p>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: C.blue,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  if (!facture) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(5px)',
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      
      <div style={{
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
      }}>
        {/* Barre d'outils */}
        <div style={{
          padding: '16px 24px',
          background: C.blue,
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
            Facture {facture.numero_facture}
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={imprimerFacture}
              style={{
                padding: '6px 14px',
                background: 'white',
                border: 'none',
                borderRadius: '6px',
                color: C.blue,
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              🖨️ Imprimer
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Contenu de la facture */}
        <div 
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          style={{ padding: '24px' }}
        />
      </div>
    </div>
  );
}
