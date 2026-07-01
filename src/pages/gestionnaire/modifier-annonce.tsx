import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const API_PRODUITS = 'https://evend-multivendeur-api.onrender.com/api/produits-vendeur';
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export default function ModifierAnnonce() {
  const [searchParams] = useSearchParams();
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [produit, setProduit] = useState<any>(null);
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);

  // État du formulaire
  const [formData, setFormData] = useState({
    nom: '',
    sku: '',
    categorie: '',
    prix: '',
    stock: '',
    typeVente: 'standard',
    description: '',
    typeAnnonce: 'neuf',
    etat: 'neuf',
    poids: '',
    hauteur: '',
    largeur: '',
    longueur: '',
    codeBarres: '',
    marque: '',
    modele: '',
    retourOffert: 'non',
    garantie: 'aucune',
    paysFabrication: '',
    produitNumerique: false,
    lienNumerique: '',
    joursAccessibles: '',
    telechargementsMax: '',
    suiviInventaire: 'suivre',
    quantiteMinimum: '1',
    source: 'e-Vend',
  });

  const produitId = searchParams.get('id');

  useEffect(() => {
    if (produitId) {
      // Décoder l'ID qui a été encodé
      const decodedId = decodeURIComponent(produitId);
      console.log('Chargement du produit avec ID:', decodedId);
      chargerProduit(decodedId);
    } else {
      setErreur('ID de produit manquant');
      setChargement(false);
    }
  }, [produitId]);

  const chargerProduit = async (id: string) => {
    try {
      setChargement(true);
      console.log('Fetching product:', `${API_PRODUITS}/${id}`);
      
      const res = await fetch(`${API_PRODUITS}/${id}`, {
        headers: authHeaders(),
      });
      
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Produit non trouvé');
        }
        throw new Error(`Erreur ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Produit chargé:', data);
      setProduit(data);
      
      // Remplir le formulaire avec les données du produit
      setFormData({
        nom: data.nom || '',
        sku: data.sku || '',
        categorie: data.categorie || '',
        prix: data.prix?.toString() || '',
        stock: data.stock?.toString() || '',
        typeVente: data.typeVente || 'standard',
        description: data.description || '',
        typeAnnonce: data.typeAnnonce || 'neuf',
        etat: data.etat || 'neuf',
        poids: data.poids?.toString() || '',
        hauteur: data.hauteur?.toString() || '',
        largeur: data.largeur?.toString() || '',
        longueur: data.longueur?.toString() || '',
        codeBarres: data.codeBarres || '',
        marque: data.marque || '',
        modele: data.modele || '',
        retourOffert: data.retourOffert || 'non',
        garantie: data.garantie || 'aucune',
        paysFabrication: data.paysFabrication || '',
        produitNumerique: data.produitNumerique || false,
        lienNumerique: data.lienNumerique || '',
        joursAccessibles: data.joursAccessibles?.toString() || '',
        telechargementsMax: data.telechargementsMax?.toString() || '',
        suiviInventaire: data.suiviInventaire || 'suivre',
        quantiteMinimum: data.quantiteMinimum?.toString() || '1',
        source: data.source || 'e-Vend',
      });
      
    } catch (error: any) {
      console.error('Erreur de chargement:', error);
      setErreur(error.message || 'Erreur lors du chargement du produit');
    } finally {
      setChargement(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produitId) return;

    try {
      setSauvegardeEnCours(true);
      
      // Décoder l'ID pour la sauvegarde
      const decodedId = decodeURIComponent(produitId);
      
      // Préparer les données pour l'API
      const dataToSend = {
        ...formData,
        prix: parseFloat(formData.prix) || 0,
        stock: parseInt(formData.stock) || 0,
        poids: formData.poids ? parseFloat(formData.poids) : undefined,
        hauteur: formData.hauteur ? parseFloat(formData.hauteur) : undefined,
        largeur: formData.largeur ? parseFloat(formData.largeur) : undefined,
        longueur: formData.longueur ? parseFloat(formData.longueur) : undefined,
        quantiteMinimum: parseInt(formData.quantiteMinimum) || 1,
        joursAccessibles: formData.joursAccessibles ? parseInt(formData.joursAccessibles) : undefined,
        telechargementsMax: formData.telechargementsMax ? parseInt(formData.telechargementsMax) : undefined,
      };

      console.log('Sauvegarde du produit:', decodedId, dataToSend);

      const res = await fetch(`${API_PRODUITS}/${decodedId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(dataToSend),
      });

      if (!res.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }

      alert('✅ Produit modifié avec succès !');
      
      // Rediriger vers la liste des produits après 1 seconde
      setTimeout(() => {
        window.history.back();
      }, 1000);
      
    } catch (error: any) {
      console.error('Erreur de sauvegarde:', error);
      alert('❌ Erreur lors de la modification');
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  if (chargement) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: '20px' }}>⏳</div>
        <div>Chargement du produit...</div>
      </div>
    );
  }

  if (erreur) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626' }}>
        <div style={{ fontSize: '24px', marginBottom: '20px' }}>❌</div>
        <div>{erreur}</div>
        <button 
          onClick={() => window.history.back()}
          style={{ marginTop: '20px', padding: '10px 20px', background: '#2d6a9f', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          Retour
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>
        Modifier l'annonce: {produit?.nom}
      </h1>

      <form onSubmit={handleSubmit} style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        
        {/* DÉTAILS DU PRODUIT */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px', color: '#2d6a9f' }}>DÉTAILS DU PRODUIT</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>
              Nom du produit <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #e1e4e8', borderRadius: '6px', fontSize: '14px' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>
              SKU
            </label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              style={{ width: '100%', padding: '10px', border: '1px solid #e1e4e8', borderRadius: '6px', fontSize: '14px' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>
              Catégorie
            </label>
            <input
              type="text"
              name="categorie"
              value={formData.categorie}
              onChange={handleChange}
              style={{ width: '100%', padding: '10px', border: '1px solid #e1e4e8', borderRadius: '6px', fontSize: '14px' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>
              Source
            </label>
            <select
              name="source"
              value={formData.source}
              onChange={handleChange}
              style={{ width: '100%', padding: '10px', border: '1px solid #e1e4e8', borderRadius: '6px', fontSize: '14px' }}
            >
              <option value="e-Vend">e-Vend</option>
              <option value="Shopify">Shopify</option>
              <option value="eBay">eBay</option>
              <option value="Amazone">Amazone</option>
              <option value="Etsy">Etsy</option>
              <option value="WooCommerce">WooCommerce</option>
              <option value="Magento">Magento</option>
              <option value="BigCommerce">BigCommerce</option>
              <option value="Square">Square</option>
              <option value="SooPOS">SooPOS</option>
              <option value="Dytel POS">Dytel POS</option>
              <option value="Squarespace">Squarespace</option>
              <option value="Linnworks">Linnworks</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              style={{ width: '100%', padding: '10px', border: '1px solid #e1e4e8', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }}
            />
          </div>
        </section>

        {/* DÉTAILS DES PRIX */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px', color: '#2d6a9f' }}>DÉTAILS DES PRIX</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>
              Prix de vente <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ padding: '10px', background: '#f1f5f9', border: '1px solid #e1e4e8', borderRight: 'none', borderRadius: '6px 0 0 6px' }}>$</span>
              <input
                type="number"
                name="prix"
                value={formData.prix}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
                style={{ flex: 1, padding: '10px', border: '1px solid #e1e4e8', borderRadius: '0 6px 6px 0', fontSize: '14px' }}
              />
            </div>
          </div>
        </section>

        {/* DÉTAILS D'EXPÉDITION */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px', color: '#2d6a9f' }}>DÉTAILS D'EXPÉDITION</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>
              Poids (KG)
            </label>
            <input
              type="number"
              name="poids"
              value={formData.poids}
              onChange={handleChange}
              step="0.01"
              min="0"
              style={{ width: '100%', padding: '10px', border: '1px solid #e1e4e8', borderRadius: '6px', fontSize: '14px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>Hauteur (cm)</label>
              <input
                type="number"
                name="hauteur"
                value={formData.hauteur}
                onChange={handleChange}
                step="0.1"
                min="0"
                style={{ width: '100%', padding: '10px', border: '1px solid #e1e4e8', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>Largeur (cm)</label>
              <input
                type="number"
                name="largeur"
                value={formData.largeur}
                onChange={handleChange}
                step="0.1"
                min="0"
                style={{ width: '100%', padding: '10px', border: '1px solid #e1e4e8', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px' }}>Longueur (cm)</label>
              <input
                type="number"
                name="longueur"
                value={formData.longueur}
                onChange={handleChange}
                step="0.1"
                min="0"
                style={{ width: '100%', padding: '10px', border: '1px solid #e1e4e8', borderRadius: '6px' }}
              />
            </div>
          </div>
        </section>

        {/* Boutons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #e1e4e8', paddingTop: '20px' }}>
          <button
            type="button"
            onClick={() => window.history.back()}
            style={{ padding: '12px 24px', background: 'white', border: '1px solid #e1e4e8', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={sauvegardeEnCours}
            style={{ padding: '12px 24px', background: '#2d6a9f', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: sauvegardeEnCours ? 'not-allowed' : 'pointer', opacity: sauvegardeEnCours ? 0.7 : 1 }}
          >
            {sauvegardeEnCours ? '⏳ Sauvegarde...' : '💾 Sauvegarder les modifications'}
          </button>
        </div>
      </form>
    </div>
  );
}
