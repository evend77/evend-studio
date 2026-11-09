// src/pages/admin/MusiquesStudio.tsx
// Catalogue de musiques de fond (boutique publique) — ajouter/modifier/
// supprimer des pistes SANS toucher au code. Le fichier mp3 lui-même doit
// déjà être uploadé via Photo.tsx (onglet 🎵 Audio) ; cette page ne gère que
// la "fiche" (nom affiché, catégorie, emoji) qui pointe vers ce fichier et
// qui apparaît ensuite dans le sélecteur de Configuration générale, côté
// vendeur.

import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../../config/api';

interface MusiqueFond {
  id: number;
  slug: string;
  nom: string;
  categorie: string;
  emoji: string;
  url: string;
  actif: boolean;
  cree_le: string;
}

interface FichierAudio {
  id: number;
  url: string;
  nom: string;
  taille: number;
}

interface Categorie {
  id: number;
  nom: string;
}

const THEME = {
  bg: '#f0f2f5',
  card: '#fff',
  border: '#e1e4e8',
  accent: '#2d6a9f',
  text: '#1a2332',
  textLight: '#6b7280',
  danger: '#dc2626',
  success: '#16a34a',
};

const EMOJIS_SUGGERES = ['🎵', '🎄', '👻', '💘', '🎉', '🌊', '🔥', '✨', '🎃', '🕯️'];

export default function MusiquesStudio() {
  const [musiques, setMusiques] = useState<MusiqueFond[]>([]);
  const [fichiersAudio, setFichiersAudio] = useState<FichierAudio[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Formulaire d'ajout
  const [fichierChoisi, setFichierChoisi] = useState('');
  const [nouveauNom, setNouveauNom] = useState('');
  const [nouvelleCategorie, setNouvelleCategorie] = useState('Général');
  const [nouvelEmoji, setNouvelEmoji] = useState('🎵');

  // Édition en ligne
  const [idEnEdition, setIdEnEdition] = useState<number | null>(null);
  const [editNom, setEditNom] = useState('');
  const [editCategorie, setEditCategorie] = useState('');
  const [editEmoji, setEditEmoji] = useState('');

  // 🏷️ Création de catégories — un champ dédié pour les créer à l'avance
  // (ex: "Halloween"), au lieu de les retaper à chaque ajout de piste. Une
  // fois créées, elles apparaissent dans le menu déroulant des formulaires
  // d'ajout/édition ci-dessous.
  const [nouvelleCategorieNom, setNouvelleCategorieNom] = useState('');
  const [creationCategorieEnCours, setCreationCategorieEnCours] = useState(false);

  // 📂 Classement par onglet dans la liste du catalogue (section du bas) —
  // onglet actif = catégorie d'une piste déjà existante (pas forcément une
  // catégorie "créée", pour ne jamais cacher une piste dont la catégorie a
  // été retirée de la liste de suggestions entre-temps). null = "Toutes".
  const [ongletCatalogue, setOngletCatalogue] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setLoading(true);
    setErreur(null);
    try {
      const [resMusiques, resAudio, resCategories] = await Promise.all([
        fetch(`${API_BASE}/effets-boutique/admin/musiques`, { credentials: 'include' }),
        fetch(`${API_BASE}/images?category=audio`, { credentials: 'include' }),
        fetch(`${API_BASE}/effets-boutique/admin/categories`, { credentials: 'include' }),
      ]);
      const dataMusiques = await resMusiques.json();
      const dataAudio = await resAudio.json();
      const dataCategories = await resCategories.json();
      setMusiques(dataMusiques.musiques || []);
      setFichiersAudio(dataAudio.images || []);
      const categoriesChargees: Categorie[] = dataCategories.categories || [];
      setCategories(categoriesChargees);
      // Pré-sélectionne la 1ère catégorie disponible dans le formulaire d'ajout
      if (categoriesChargees.length > 0) {
        setNouvelleCategorie(prev => categoriesChargees.some(c => c.nom === prev) ? prev : categoriesChargees[0].nom);
      }
    } catch (e) {
      console.error('Erreur chargement:', e);
      setErreur('Impossible de charger le catalogue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const creerCategorie = async () => {
    const nom = nouvelleCategorieNom.trim();
    if (!nom) { setErreur('Le nom de la catégorie est requis.'); return; }
    setCreationCategorieEnCours(true);
    setErreur(null);
    try {
      const res = await fetch(`${API_BASE}/effets-boutique/admin/categories`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création de la catégorie');
      setCategories(prev => [...prev, data.categorie].sort((a, b) => a.nom.localeCompare(b.nom)));
      setNouvelleCategorieNom('');
    } catch (e: any) {
      setErreur(e.message || 'Erreur lors de la création de la catégorie');
    } finally {
      setCreationCategorieEnCours(false);
    }
  };

  const supprimerCategorie = async (c: Categorie) => {
    if (!confirm(`Retirer la catégorie "${c.nom}" de la liste ? Les pistes qui l'utilisent déjà ne sont pas affectées.`)) return;
    try {
      await fetch(`${API_BASE}/effets-boutique/admin/categories/${c.id}`, { method: 'DELETE', credentials: 'include' });
      setCategories(prev => prev.filter(x => x.id !== c.id));
    } catch (e) {
      setErreur('Erreur lors de la suppression de la catégorie');
    }
  };

  // Quand on choisit un fichier déjà uploadé, on pré-remplit le nom à partir
  // de son nom de fichier (l'admin peut toujours le modifier avant d'ajouter).
  const choisirFichier = (url: string) => {
    setFichierChoisi(url);
    if (!nouveauNom) {
      const fichier = fichiersAudio.find(f => f.url === url);
      if (fichier) {
        const nomSansExtension = fichier.nom.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
        setNouveauNom(nomSansExtension);
      }
    }
  };

  const ajouterMusique = async () => {
    if (!fichierChoisi) { setErreur('Choisis un fichier audio déjà uploadé (onglet Audio de Photo).'); return; }
    if (!nouveauNom.trim()) { setErreur('Le nom est requis.'); return; }
    setSaving(true);
    setErreur(null);
    try {
      const res = await fetch(`${API_BASE}/effets-boutique/admin/musiques`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: nouveauNom.trim(), categorie: nouvelleCategorie.trim() || 'Général', emoji: nouvelEmoji, url: fichierChoisi }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'ajout");
      setMusiques(prev => [data.musique, ...prev]);
      setFichierChoisi('');
      setNouveauNom('');
      setNouvelleCategorie(categories[0]?.nom || 'Général');
      setNouvelEmoji('🎵');
    } catch (e: any) {
      setErreur(e.message || "Erreur lors de l'ajout");
    } finally {
      setSaving(false);
    }
  };

  const commencerEdition = (m: MusiqueFond) => {
    setIdEnEdition(m.id);
    setEditNom(m.nom);
    setEditCategorie(m.categorie);
    setEditEmoji(m.emoji);
  };

  const annulerEdition = () => setIdEnEdition(null);

  const sauvegarderEdition = async (id: number) => {
    setSaving(true);
    setErreur(null);
    try {
      const res = await fetch(`${API_BASE}/effets-boutique/admin/musiques/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: editNom.trim(), categorie: editCategorie.trim() || 'Général', emoji: editEmoji }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la modification');
      setMusiques(prev => prev.map(m => m.id === id ? data.musique : m));
      setIdEnEdition(null);
    } catch (e: any) {
      setErreur(e.message || 'Erreur lors de la modification');
    } finally {
      setSaving(false);
    }
  };

  const toggleActif = async (m: MusiqueFond) => {
    try {
      const res = await fetch(`${API_BASE}/effets-boutique/admin/musiques/${m.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actif: !m.actif }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setMusiques(prev => prev.map(x => x.id === m.id ? data.musique : x));
    } catch (e: any) {
      setErreur(e.message || 'Erreur lors du changement de statut');
    }
  };

  const supprimerMusique = async (m: MusiqueFond) => {
    if (!confirm(`Supprimer "${m.nom}" du catalogue ? Les boutiques qui l'avaient choisie retomberont automatiquement sur "Aucune musique".`)) return;
    try {
      await fetch(`${API_BASE}/effets-boutique/admin/musiques/${m.id}`, { method: 'DELETE', credentials: 'include' });
      setMusiques(prev => prev.filter(x => x.id !== m.id));
    } catch (e) {
      setErreur('Erreur lors de la suppression');
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: '8px 10px', border: `1px solid ${THEME.border}`, borderRadius: '8px', fontSize: '13px', width: '100%', boxSizing: 'border-box',
  };

  // 📂 Onglets de la liste du catalogue — dérivés des catégories réellement
  // portées par des pistes (pas de la table "catégories créées"), triés
  // alphabétiquement, avec un compteur par onglet.
  const categoriesCatalogue = Array.from(new Set(musiques.map(m => m.categorie))).sort();
  const musiquesAffichees = ongletCatalogue
    ? musiques.filter(m => m.categorie === ongletCatalogue)
    : musiques;

  return (
    <div style={{ padding: '24px', background: THEME.bg, minHeight: '100vh' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>🎵 Musiques de fond</h1>
        <p style={{ fontSize: '14px', color: THEME.textLight, margin: '4px 0 0' }}>
          Catalogue des pistes proposées aux gestionnaires (add-on « Effets de boutique ») — {musiques.length} piste{musiques.length > 1 ? 's' : ''}
        </p>
      </div>

      {erreur && (
        <div style={{ backgroundColor: '#fdecea', border: '1px solid #f5c6cb', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', color: THEME.danger, margin: 0 }}>⚠️ {erreur}</p>
        </div>
      )}

      {/* ── Catégories ── */}
      <div style={{ background: THEME.card, borderRadius: '14px', border: `1px solid ${THEME.border}`, padding: '20px', marginBottom: '24px' }}>
        <p style={{ fontWeight: 700, fontSize: '15px', margin: '0 0 4px' }}>🏷️ Catégories</p>
        <p style={{ fontSize: '12px', color: THEME.textLight, margin: '0 0 14px' }}>
          Crée ici les catégories (ex: Noël, Halloween) — elles deviennent des onglets dans le sélecteur de musique côté gestionnaire, et tu les choisis dans un menu déroulant en ajoutant une piste.
        </p>
        <div style={{ display: 'flex', gap: '8px', marginBottom: categories.length > 0 ? '14px' : 0 }}>
          <input
            type="text"
            value={nouvelleCategorieNom}
            onChange={e => setNouvelleCategorieNom(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') creerCategorie(); }}
            placeholder="Ex: Halloween"
            style={{ ...inputStyle, maxWidth: '260px' }}
            maxLength={60}
          />
          <button
            onClick={creerCategorie}
            disabled={creationCategorieEnCours || !nouvelleCategorieNom.trim()}
            style={{ padding: '8px 16px', background: THEME.accent, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: creationCategorieEnCours || !nouvelleCategorieNom.trim() ? 'not-allowed' : 'pointer', opacity: creationCategorieEnCours || !nouvelleCategorieNom.trim() ? 0.6 : 1, whiteSpace: 'nowrap' }}
          >
            {creationCategorieEnCours ? 'Création...' : '+ Créer'}
          </button>
        </div>
        {categories.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {categories.map(c => (
              <span key={c.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 6px 5px 12px', borderRadius: '999px', border: `1px solid ${THEME.border}`, background: '#fafbfc', fontSize: '12px', fontWeight: 600, color: THEME.text }}>
                {c.nom}
                <button
                  onClick={() => supprimerCategorie(c)}
                  title="Retirer cette catégorie de la liste"
                  style={{ width: '18px', height: '18px', borderRadius: '50%', border: 'none', background: '#e5e7eb', color: THEME.textLight, fontSize: '11px', lineHeight: '18px', textAlign: 'center', cursor: 'pointer', padding: 0 }}
                >✕</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Formulaire d'ajout ── */}
      <div style={{ background: THEME.card, borderRadius: '14px', border: `1px solid ${THEME.border}`, padding: '20px', marginBottom: '24px' }}>
        <p style={{ fontWeight: 700, fontSize: '15px', margin: '0 0 12px' }}>+ Ajouter une piste au catalogue</p>
        <p style={{ fontSize: '12px', color: THEME.textLight, margin: '0 0 14px' }}>
          Le fichier mp3 doit d'abord être uploadé dans <strong>Paramètres → Photo → onglet 🎵 Audio</strong>. Choisis-le ici ensuite pour l'ajouter au sélecteur des vendeurs.
        </p>

        {fichiersAudio.length === 0 ? (
          <p style={{ fontSize: '13px', color: THEME.textLight, fontStyle: 'italic' }}>
            Aucun fichier audio uploadé pour l'instant — va d'abord dans Photo → Audio.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: THEME.textLight, display: 'block', marginBottom: '4px' }}>Fichier audio</label>
              <select value={fichierChoisi} onChange={e => choisirFichier(e.target.value)} style={inputStyle}>
                <option value="">-- Choisir un fichier --</option>
                {fichiersAudio.map(f => (
                  <option key={f.id} value={f.url}>{f.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', color: THEME.textLight, display: 'block', marginBottom: '4px' }}>Nom affiché</label>
              <input type="text" value={nouveauNom} onChange={e => setNouveauNom(e.target.value)} placeholder="Ex: Big Moment" style={inputStyle} maxLength={100} />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: THEME.textLight, display: 'block', marginBottom: '4px' }}>Catégorie (onglet gestionnaire)</label>
              {categories.length === 0 ? (
                <p style={{ fontSize: '12px', color: THEME.textLight, fontStyle: 'italic', margin: 0 }}>
                  Crée d'abord une catégorie ci-dessus.
                </p>
              ) : (
                <select value={nouvelleCategorie} onChange={e => setNouvelleCategorie(e.target.value)} style={inputStyle}>
                  {categories.map(c => (
                    <option key={c.id} value={c.nom}>{c.nom}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label style={{ fontSize: '11px', color: THEME.textLight, display: 'block', marginBottom: '4px' }}>Emoji</label>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {EMOJIS_SUGGERES.map(e => (
                  <button key={e} type="button" onClick={() => setNouvelEmoji(e)}
                    style={{ fontSize: '18px', padding: '4px 6px', borderRadius: '6px', border: nouvelEmoji === e ? `2px solid ${THEME.accent}` : `1px solid ${THEME.border}`, background: '#fff', cursor: 'pointer' }}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={ajouterMusique}
          disabled={saving || !fichierChoisi}
          style={{ marginTop: '14px', padding: '10px 20px', background: THEME.accent, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: saving || !fichierChoisi ? 'not-allowed' : 'pointer', opacity: saving || !fichierChoisi ? 0.6 : 1 }}
        >
          {saving ? 'Ajout...' : '+ Ajouter au catalogue'}
        </button>
      </div>

      {/* ── Liste du catalogue ── */}
      <div style={{ background: THEME.card, borderRadius: '14px', border: `1px solid ${THEME.border}`, overflow: 'hidden' }}>
        {!loading && musiques.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', padding: '16px 20px 0' }}>
            <button
              type="button"
              onClick={() => setOngletCatalogue(null)}
              style={{
                padding: '6px 14px', fontSize: '12px', fontWeight: 700, borderRadius: '999px', cursor: 'pointer',
                border: ongletCatalogue === null ? `2px solid ${THEME.accent}` : `1px solid ${THEME.border}`,
                background: ongletCatalogue === null ? THEME.accent : '#fff',
                color: ongletCatalogue === null ? '#fff' : THEME.text,
              }}
            >
              Toutes ({musiques.length})
            </button>
            {categoriesCatalogue.map(cat => {
              const nb = musiques.filter(m => m.categorie === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setOngletCatalogue(cat)}
                  style={{
                    padding: '6px 14px', fontSize: '12px', fontWeight: 700, borderRadius: '999px', cursor: 'pointer',
                    border: ongletCatalogue === cat ? `2px solid ${THEME.accent}` : `1px solid ${THEME.border}`,
                    background: ongletCatalogue === cat ? THEME.accent : '#fff',
                    color: ongletCatalogue === cat ? '#fff' : THEME.text,
                  }}
                >
                  {cat} ({nb})
                </button>
              );
            })}
          </div>
        )}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: THEME.textLight }}>Chargement...</div>
        ) : musiques.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: THEME.textLight }}>Le catalogue est vide pour l'instant.</div>
        ) : musiquesAffichees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: THEME.textLight }}>Aucune piste dans cette catégorie.</div>
        ) : (
          <div style={{ marginTop: '12px' }}>
            {musiquesAffichees.map((m, i) => (
              <div key={m.id} style={{ padding: '14px 20px', borderBottom: i < musiquesAffichees.length - 1 ? `1px solid ${THEME.border}` : 'none', display: 'flex', alignItems: 'center', gap: '14px', opacity: m.actif ? 1 : 0.5 }}>
                {idEnEdition === m.id ? (
                  <>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '160px' }}>
                      {EMOJIS_SUGGERES.map(e => (
                        <button key={e} type="button" onClick={() => setEditEmoji(e)}
                          style={{ fontSize: '16px', padding: '2px 4px', borderRadius: '6px', border: editEmoji === e ? `2px solid ${THEME.accent}` : `1px solid ${THEME.border}`, background: '#fff', cursor: 'pointer' }}>
                          {e}
                        </button>
                      ))}
                    </div>
                    <input type="text" value={editNom} onChange={e => setEditNom(e.target.value)} style={{ ...inputStyle, flex: 1 }} maxLength={100} />
                    <select value={editCategorie} onChange={e => setEditCategorie(e.target.value)} style={{ ...inputStyle, width: '140px' }}>
                      {/* La piste peut porter une catégorie qui n'est plus dans la liste
                          (supprimée depuis) — on l'affiche quand même pour ne pas la perdre
                          silencieusement si l'admin ne change pas ce champ. */}
                      {!categories.some(c => c.nom === editCategorie) && editCategorie && (
                        <option value={editCategorie}>{editCategorie}</option>
                      )}
                      {categories.map(c => (
                        <option key={c.id} value={c.nom}>{c.nom}</option>
                      ))}
                    </select>
                    <button onClick={() => sauvegarderEdition(m.id)} disabled={saving} style={{ padding: '8px 14px', background: THEME.success, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>✓ Sauver</button>
                    <button onClick={annulerEdition} style={{ padding: '8px 14px', background: '#fff', color: THEME.textLight, border: `1px solid ${THEME.border}`, borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Annuler</button>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '24px' }}>{m.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: '14px', margin: 0 }}>{m.nom}</p>
                      <p style={{ fontSize: '12px', color: THEME.textLight, margin: '2px 0 0' }}>{m.categorie} · slug: {m.slug}{!m.actif ? ' · désactivée' : ''}</p>
                    </div>
                    <audio controls src={m.url} style={{ height: '32px', width: '200px' }} />
                    <button onClick={() => toggleActif(m)} style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', border: `1px solid ${THEME.border}`, background: '#fff', color: THEME.text, cursor: 'pointer' }}>
                      {m.actif ? 'Désactiver' : 'Activer'}
                    </button>
                    <button onClick={() => commencerEdition(m)} style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', border: `1px solid ${THEME.border}`, background: '#fff', color: THEME.text, cursor: 'pointer' }}>
                      ✏️ Modifier
                    </button>
                    <button onClick={() => supprimerMusique(m)} style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', border: `1px solid ${THEME.danger}`, background: '#fff', color: THEME.danger, cursor: 'pointer' }}>
                      🗑 Supprimer
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}