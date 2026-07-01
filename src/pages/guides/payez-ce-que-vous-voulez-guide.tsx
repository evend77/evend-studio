import React from 'react';
import { Link } from 'react-router-dom';

export default function PayWhatYouWantGuide() {
  const styles = {
    accent: '#2d6a9f',
    accentLight: '#e8f2fb',
    bg: '#f0f2f5',
    card: '#fff',
    border: '#e1e4e8',
    text: '#1a2332',
    textLight: '#6b7280',
    success: '#16a34a',
    warning: '#d97706',
    purple: '#8b5cf6',
    purpleLight: '#ede9fe',
    blue: '#2563eb',
    blueLight: '#dbeafe',
    orange: '#ea580c',
    orangeLight: '#ffedd5',
    red: '#dc2626',
    redLight: '#fee2e2',
    teal: '#14b8a6',
    tealLight: '#ccfbf1'
  };

  return (
    <div style={{
      backgroundColor: styles.bg,
      minHeight: '100vh',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: styles.card,
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 20px 35px -10px rgba(0,0,0,0.1)'
      }}>
        
        {/* En-tête */}
        <div style={{
          background: `linear-gradient(135deg, ${styles.teal} 0%, ${styles.accent} 100%)`,
          padding: '60px 40px',
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{ 
            fontSize: '80px', 
            marginBottom: '32px',
            display: 'inline-block',
            animation: 'bounce 2s ease infinite'
          }}>
            💰🎯
          </div>
          <style>{`
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }
          `}</style>
          <h1 style={{
            fontSize: '42px',
            fontWeight: '800',
            marginBottom: '16px',
            letterSpacing: '-0.5px'
          }}>
            Guide d'utilisation - Payez ce que vous voulez
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Laissez vos clients choisir le prix qu'ils souhaitent payer
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>💰 Prix libre</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🎯 Montant minimum</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📊 Prix fixe ou pourcentage</span>
          </div>
        </div>

        {/* Sommaire */}
        <div style={{
          padding: '32px 48px',
          background: '#f8fafc',
          borderBottom: `1px solid ${styles.border}`
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>📑 Sommaire</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            {[
              'Introduction',
              'Prérequis et tarification',
              'Installation et activation',
              'Configuration des codes',
              'Création de produits',
              'Types de prix minimum',
              'Affichage frontal',
              'Validation du paiement',
              'Foire aux questions',
              'Support'
            ].map((item, i) => (
              <a key={i} href={`#section-${i}`} style={{
                color: styles.accent,
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {item}
              </a>
            ))}
          </div>
        </div>

        {/* Contenu principal */}
        <div style={{ padding: '48px' }}>
          
          {/* Section 1: Introduction */}
          <section id="section-0" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📖 Introduction
            </h2>
            <p style={{ fontSize: '16px', lineHeight: '1.7', color: styles.textLight, marginBottom: '20px' }}>
              L'add-on <strong>Payez ce que vous voulez</strong> (Pay What You Want - PWYW) permet aux clients de choisir 
              le montant qu'ils souhaitent payer pour un produit. Un prix minimum peut être défini, et un prix suggéré 
              peut être indiqué comme guide. Cette stratégie de prix est idéale pour les produits numériques, 
              les dons, ou les contenus créatifs.
            </p>
            <div style={{
              background: styles.tealLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.teal}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> Ce modèle est également connu sous le nom "Value-for-Value". 
                Le prix minimum peut être défini de manière fixe ou en pourcentage du prix original.
              </p>
            </div>
          </section>

          {/* Section 2: Prérequis et tarification */}
          <section id="section-1" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              ⚠️ Prérequis et tarification
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`,
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Conditions préalables</h3>
              <ul style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Plan <strong>Multivendor PRO</strong> (60$/mois) ou supérieur</li>
                <li>Frais supplémentaires de <strong>10$ USD par mois</strong> pour l'add-on Payez ce que vous voulez</li>
              </ul>
            </div>
          </section>

          {/* Section 3: Installation et activation */}
          <section id="section-2" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              ⚙️ Installation et activation
            </h2>
            
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  width: '32px',
                  height: '32px',
                  background: styles.accent,
                  color: 'white',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>1</span>
                Activer l'add-on
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Rendez-vous dans la section <strong>Modules complémentaires</strong> de votre tableau de bord administrateur.
                Recherchez "Payez ce que vous voulez" et cliquez sur le bouton <strong>Activer</strong>.
              </p>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  width: '32px',
                  height: '32px',
                  background: styles.accent,
                  color: 'white',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>2</span>
                Accepter les frais supplémentaires
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Acceptez les frais mensuels de 10$ USD et approuvez le paiement dans Shopify Backend.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  width: '32px',
                  height: '32px',
                  background: styles.accent,
                  color: 'white',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>3</span>
                Accéder à la configuration
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Une fois activé, la fonctionnalité est disponible. Les codes d'intégration sont dans 
                <strong>Configuration</strong> → <strong>Instructions pour la marketplace</strong>.
              </p>
            </div>
          </section>

          {/* Section 4: Configuration des codes */}
          <section id="section-3" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📝 Configuration des codes
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Codes à ajouter dans les templates
              </h3>
              
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>1. Page produit (product-template.liquid)</h4>
                <div style={{
                  background: '#1a2332',
                  borderRadius: '12px',
                  padding: '12px',
                  marginBottom: '8px'
                }}>
                  <code style={{ fontSize: '12px', color: '#e1e4e8' }}>
                    {'{% if product.tags contains \'wk_pay_what_you_want\' %}<div class="wk_error_message" style="visibility:hidden">Vous devez payer au moins <span id="wk_var_price"></span></div> <div id="wk_custom_price_div" data-productid="{{ product.id }}" data-productprice="{{product}}"><input id="wk_variant_id" type="hidden" name="properties[wk_variant_id]" value="" ><input type="hidden" name="properties[wk_pay_what_you_want]" value="true" ><p class="wk_pay_what_you_want" style="visibility:visible"><label for="wk_custom_price">Saisissez le prix que vous voulez payer</label><input id="wk_custom_price" type="number" name="properties[wk_custom_price]" value="" ></p></div>{% endif %}'}
                  </code>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>2. Masquer le prix des produits PWYW</h4>
                <div style={{
                  background: '#1a2332',
                  borderRadius: '12px',
                  padding: '12px',
                  marginBottom: '8px'
                }}>
                  <code style={{ fontSize: '12px', color: '#e1e4e8' }}>
                    {'{% unless product.tags contains \'wk_pay_what_you_want\' %}<!--votre code prix-->{% endunless %}'}
                  </code>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>3. Classe pour le bouton Ajouter au panier</h4>
                <div style={{
                  background: '#1a2332',
                  borderRadius: '12px',
                  padding: '12px',
                  marginBottom: '8px'
                }}>
                  <code style={{ fontSize: '12px', color: '#e1e4e8' }}>
                    {'{% if product.tags contains \'wk_pay_what_you_want\' and current_variant.available %} wk_choice_pay {% endif %}'}
                  </code>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>4. Attribut disabled sur le bouton</h4>
                <div style={{
                  background: '#1a2332',
                  borderRadius: '12px',
                  padding: '12px',
                  marginBottom: '8px'
                }}>
                  <code style={{ fontSize: '12px', color: '#e1e4e8' }}>
                    {'{% if product.tags contains \'wk_pay_what_you_want\' %} disabled {% endif %}'}
                  </code>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>5. Classe pour le sélecteur de quantité</h4>
                <div style={{
                  background: '#1a2332',
                  borderRadius: '12px',
                  padding: '12px',
                  marginBottom: '8px'
                }}>
                  <code style={{ fontSize: '12px', color: '#e1e4e8' }}>
                    wk_qty_selector
                  </code>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>6. Code pour le panier (cart-template.liquid)</h4>
                <div style={{
                  background: '#1a2332',
                  borderRadius: '12px',
                  padding: '12px',
                  marginBottom: '8px'
                }}>
                  <code style={{ fontSize: '12px', color: '#e1e4e8' }}>
                    {'{% assign wk_pay_whatever_extra_price = 0 %}'}
                  </code>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Création de produits */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              ➕ Création de produits PWYW
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Procédure
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Produits</strong> → <strong>Liste des produits</strong></li>
                <li>Ajoutez un nouveau produit ou modifiez un produit existant</li>
                <li>Cochez <strong>Marquer comme produit "Payez ce que vous voulez"</strong></li>
                <li>Saisissez le <strong>prix minimum</strong> (montant minimum que le client doit payer)</li>
                <li>Choisissez le <strong>type de prix minimum</strong> :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li><strong>Fixé</strong> : Montant fixe (ex: 5€ minimum)</li>
                  <li><strong>Pourcentage</strong> : Pourcentage du prix original (ex: 50% du prix)</li>
                </ul>
                <li>Remplissez le reste du formulaire</li>
                <li>Enregistrez le produit</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fff3cd',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Les produits normaux peuvent être convertis en produits PWYW et vice-versa à tout moment.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Types de prix minimum */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📊 Types de prix minimum
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              
              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.blue}, ${styles.blue}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>💰</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Prix minimum fixé</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Définissez un montant fixe que le client doit au minimum payer.
                  </p>
                  <div style={{
                    background: styles.tealLight,
                    borderRadius: '8px',
                    padding: '12px'
                  }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '500' }}>Exemple :</p>
                    <p style={{ margin: 0, fontSize: '13px' }}>Prix minimum : 5€</p>
                    <p style={{ margin: 0, fontSize: '13px' }}>Le client peut payer entre 5€ et le montant de son choix</p>
                  </div>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.purple}, ${styles.purple}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Prix minimum en pourcentage</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Définissez un pourcentage du prix original que le client doit au minimum payer.
                  </p>
                  <div style={{
                    background: styles.tealLight,
                    borderRadius: '8px',
                    padding: '12px'
                  }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '500' }}>Exemple :</p>
                    <p style={{ margin: 0, fontSize: '13px' }}>Prix original : 20€</p>
                    <p style={{ margin: 0, fontSize: '13px' }}>Pourcentage minimum : 50%</p>
                    <p style={{ margin: 0, fontSize: '13px' }}>Prix minimum : 10€</p>
                  </div>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.success}, ${styles.success}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎯</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Prix suggéré</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Vous pouvez également indiquer un prix suggéré pour guider le client dans son choix.
                  </p>
                  <div style={{
                    background: styles.tealLight,
                    borderRadius: '8px',
                    padding: '12px'
                  }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '500' }}>Exemple :</p>
                    <p style={{ margin: 0, fontSize: '13px' }}>Prix suggéré : 15€</p>
                    <p style={{ margin: 0, fontSize: '13px' }}>Prix minimum : 5€</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7: Affichage frontal */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🖥️ Affichage frontal
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>🛍️</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Page produit</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Le client voit un champ de saisie pour entrer le montant souhaité. 
                  Le prix minimum est affiché comme référence.
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>🛒</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Page panier</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Le montant saisi par le client apparaît dans le panier. Les calculs de sous-total 
                  et de total sont mis à jour automatiquement.
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>⚠️</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Message d'erreur</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Si le client saisit un montant inférieur au prix minimum, un message d'erreur s'affiche :
                  "Vous devez payer au moins X€".
                </p>
              </div>
            </div>

            <div style={{
              marginTop: '24px',
              background: styles.accentLight,
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, fontWeight: '500' }}>
                💡 <strong>Note :</strong> Sur la page profil vendeur, les prix des produits PWYW ne sont pas affichés par défaut. 
                Ajoutez le code fourni dans les instructions pour les afficher si nécessaire.
              </p>
            </div>
          </section>

          {/* Section 8: Validation du paiement */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              ✅ Validation du paiement
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Processus de validation
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Le client saisit le montant souhaité</li>
                <li>Le système vérifie que le montant est {'>'} = au prix minimum</li>
                <li>Si valide, le client peut ajouter au panier</li>
                <li>Le montant saisi est utilisé comme prix final</li>
                <li>La commande est traitée normalement</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.tealLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Si le client saisit un montant inférieur au minimum, le bouton d'ajout au panier 
                  reste désactivé et un message d'erreur s'affiche.
                </p>
              </div>
            </div>
          </section>

          {/* Section 9: FAQ */}
          <section id="section-8" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              ❓ Foire aux questions
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Un produit normal peut-il devenir un produit PWYW ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui ! Les produits normaux peuvent être convertis en produits PWYW et vice-versa à tout moment. 
                  Il suffit de cocher ou décocher l'option lors de la modification du produit.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Quelle est la différence entre prix minimum fixé et en pourcentage ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Le prix minimum fixé est un montant absolu (ex: 5€). Le prix minimum en pourcentage est calculé 
                  à partir du prix original (ex: 50% du prix original). Le pourcentage permet d'ajuster automatiquement 
                  le prix minimum si le prix du produit change.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les clients peuvent-ils payer plus que le prix suggéré ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui ! Le principe du "Payez ce que vous voulez" permet aux clients de payer le montant de leur choix, 
                  qu'il soit inférieur, égal ou supérieur au prix suggéré. Le seul impératif est de respecter le prix minimum.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment les commissions sont-elles calculées ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Les commissions sont calculées sur le montant final payé par le client, selon la configuration 
                  habituelle des commissions de votre marketplace.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les codes promo sont-ils compatibles ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Les codes promo s'appliquent normalement sur le montant saisi par le client, sous réserve 
                  que le montant final ne descende pas en dessous du prix minimum.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les produits PWYW apparaissent-ils dans les résultats de recherche ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, les produits apparaissent normalement dans les résultats de recherche. 
                  Le prix affiché est masqué si vous avez ajouté le code approprié, ou remplacé par un libellé "Prix libre".
                </p>
              </div>
            </div>
          </section>

          {/* Section 10: Support */}
          <section id="section-9" style={{
            background: `linear-gradient(135deg, ${styles.accentLight} 0%, white 100%)`,
            borderRadius: '20px',
            padding: '48px',
            textAlign: 'center',
            border: `1px solid ${styles.border}`
          }}>
            <div style={{ 
              fontSize: '64px', 
              marginBottom: '24px',
              display: 'inline-block'
            }}>
              🛟
            </div>
            <h3 style={{ 
              fontSize: '28px', 
              fontWeight: '700', 
              marginBottom: '16px', 
              color: styles.text 
            }}>
              Besoin d'aide supplémentaire ?
            </h3>
            <p style={{ color: styles.textLight, marginBottom: '32px', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto', fontSize: '16px' }}>
              Notre équipe d'experts est disponible 24h/24 et 7j/7 pour vous accompagner dans la configuration 
              et l'optimisation de votre stratégie "Payez ce que vous voulez".
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/addons" style={{
                background: styles.accent,
                color: 'white',
                padding: '14px 32px',
                borderRadius: '40px',
                textDecoration: 'none',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ← Retour aux add-ons
              </Link>
              <a href="mailto:support@evend.ca" style={{
                background: 'white',
                color: styles.accent,
                padding: '14px 32px',
                borderRadius: '40px',
                textDecoration: 'none',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                border: `1px solid ${styles.accent}`
              }}>
                📧 Contacter le support
              </a>
              <a href="#" style={{
                background: '#f0f2f5',
                color: styles.text,
                padding: '14px 32px',
                borderRadius: '40px',
                textDecoration: 'none',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                border: `1px solid ${styles.border}`
              }}>
                📚 Documentation PWYW
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
