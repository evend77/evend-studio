// src/pages/admin/PagesPlateforme.tsx
// Gestion DYNAMIQUE des pages — Éditeur double onglet (Visuel / HTML / Aperçu)
// Avec tri alphabétique et recherche

import { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../../config/api';
import { TEMPLATES } from '../PageTemplates';

interface PagePlateforme {
  id: number;
  slug: string;
  titre: string;
  contenu: string | null;
  actif: boolean;
  ordre: number;
  meta_description: string | null;
  afficher_dans_menu: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string;
}

const T = {
  bg: '#f0f2f5', card: '#fff', border: '#e1e4e8',
  accent: '#2d6a9f', text: '#1a2332', textLight: '#6b7280',
  danger: '#dc2626', success: '#16a34a', warning: '#d97706',
};

export default function PagesPlateforme({ naviguerVers }: { naviguerVers?: (p: string) => void }) {
  const [pages, setPages] = useState<PagePlateforme[]>([]);
  const [ongletActif, setOngletActif] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sauvegarde, setSauvegarde] = useState(false);
  const [messageSauvegarde, setMessageSauvegarde] = useState<string | null>(null);
  const [contenuEdite, setContenuEdite] = useState<Record<string, string>>({});
  
  // État pour le triple onglet (Visuel / HTML / Aperçu)
  const [modeEdition, setModeEdition] = useState<'visuel' | 'html' | 'apercu'>('visuel');
  const [texteVisuel, setTexteVisuel] = useState<Record<string, string>>({});
  
  // État pour la modification du titre
  const [editionTitre, setEditionTitre] = useState(false);
  const [nouveauTitre, setNouveauTitre] = useState('');
  
  // Recherche et tri
  const [searchTerm, setSearchTerm] = useState('');
  
  // États pour le modal de création
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [typePage, setTypePage] = useState<'normale' | 'guide-template'>('normale');
  const [templateChoisi, setTemplateChoisi] = useState('');
  const [newPage, setNewPage] = useState({
    slug: '',
    titre: '',
    description: '',
  });
  const [creating, setCreating] = useState(false);
  
  // États pour la suppression
  const [pageToDelete, setPageToDelete] = useState<PagePlateforme | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const visuelTextareaRef = useRef<HTMLTextAreaElement>(null);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const cursorPosRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const token = localStorage.getItem('token');

  // États pour le modal d'insertion de média
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaAlt, setMediaAlt] = useState('');
  const [mediaWidth, setMediaWidth] = useState('100%');
  const [mediaInsertMode, setMediaInsertMode] = useState<'visuel' | 'html'>('visuel');
  const [uploading, setUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  useEffect(() => { fetchPages(); }, []);

  // Injecter le HTML dans le contentEditable quand on change de page ou de mode
  useEffect(() => {
    if (modeEdition !== 'visuel') return;
    if (!contentEditableRef.current) return;
    const slug = pages[ongletActif]?.slug;
    if (!slug) return;
    const html = contenuEdite[slug] || '';
    // Ne pas écraser si déjà identique (évite de resetter le curseur pendant la frappe)
    if (contentEditableRef.current.innerHTML !== html) {
      contentEditableRef.current.innerHTML = html;
    }
  }, [ongletActif, modeEdition]);

  // ─────────────────────────────────────────────────────────────────────────
  // CONVERSION HTML <-> TEXTE VISUEL
  // ─────────────────────────────────────────────────────────────────────────

  // Extraire le texte brut du HTML (pour compteur de caractères seulement)
  function htmlVersTexte(html: string): string {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    return (div.innerText || '').trim();
  }

  // Convertir texte visuel en HTML (pour sauvegarder)
  // IMPORTANT : les lignes qui sont déjà du HTML (balises) sont passées telles quelles
  function texteVersHtml(texte: string): string {
    if (!texte) return '';

    // Si le contenu est déjà du HTML pur (commence par une balise) → retourner tel quel
    const trimmed = texte.trim();
    if (/^<[a-zA-Z]/.test(trimmed)) return trimmed;

    const lignes = texte.split('\n');
    let resultat = '';
    let dansListePuces = false;
    let dansListeNum = false;

    for (let i = 0; i < lignes.length; i++) {
      let ligne = lignes[i].trim();

      if (ligne === '') {
        if (dansListePuces) { resultat += '</ul>\n'; dansListePuces = false; }
        if (dansListeNum) { resultat += '</ol>\n'; dansListeNum = false; }
        continue;
      }

      // Ligne déjà en HTML → passer telle quelle sans l'envelopper dans <p>
      if (/^<[a-zA-Z!\/]/.test(ligne)) {
        if (dansListePuces) { resultat += '</ul>\n'; dansListePuces = false; }
        if (dansListeNum) { resultat += '</ol>\n'; dansListeNum = false; }
        resultat += ligne + '\n';
        continue;
      }

      const estTitre = ligne.length < 60 && !ligne.match(/[.!?]$/) &&
                       (i === 0 || lignes[i-1].trim() === '');
      if (estTitre && !ligne.startsWith('-') && !ligne.match(/^\d+\./)) {
        if (dansListePuces) { resultat += '</ul>\n'; dansListePuces = false; }
        if (dansListeNum) { resultat += '</ol>\n'; dansListeNum = false; }
        resultat += `<h1>${ligne}</h1>\n`;
        continue;
      }

      if (ligne.startsWith('- ') || ligne.startsWith('• ') || ligne.startsWith('* ')) {
        const item = ligne.replace(/^[-•*]\s+/, '');
        if (!dansListePuces && dansListeNum) { resultat += '</ol>\n'; dansListeNum = false; }
        if (!dansListePuces) { resultat += '<ul>\n'; dansListePuces = true; }
        resultat += `  <li>${item}</li>\n`;
        continue;
      }

      if (ligne.match(/^\d+\.\s/)) {
        const item = ligne.replace(/^\d+\.\s/, '');
        if (!dansListeNum && dansListePuces) { resultat += '</ul>\n'; dansListePuces = false; }
        if (!dansListeNum) { resultat += '<ol>\n'; dansListeNum = true; }
        resultat += `  <li>${item}</li>\n`;
        continue;
      }

      if (dansListePuces) { resultat += '</ul>\n'; dansListePuces = false; }
      if (dansListeNum) { resultat += '</ol>\n'; dansListeNum = false; }
      resultat += `<p>${ligne}</p>\n`;
    }

    if (dansListePuces) resultat += '</ul>\n';
    if (dansListeNum) resultat += '</ol>\n';

    return resultat;
  }

  async function fetchPages() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/pagesPlateforme`, {
        credentials: 'include', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const pageList: PagePlateforme[] = data.pages || [];
      setPages(pageList);
      
      const mapHtml: Record<string, string> = {};
      const mapVisuel: Record<string, string> = {};
      pageList.forEach((p: PagePlateforme) => {
        const html = p.contenu || '';
        mapHtml[p.slug] = html;
        mapVisuel[p.slug] = htmlVersTexte(html);
      });
      setContenuEdite(mapHtml);
      setTexteVisuel(mapVisuel);
      
      if (pageList.length > 0 && ongletActif >= pageList.length) {
        setOngletActif(0);
      }
    } catch (error) {
      console.error('Erreur chargement pages:', error);
      setMessageSauvegarde('❌ Erreur de chargement des pages');
      setTimeout(() => setMessageSauvegarde(null), 3000);
    } finally {
      setLoading(false);
    }
  }

  async function sauvegarder() {
    const pageActuelle = pages[ongletActif];
    if (!pageActuelle) return;
    setSauvegarde(true);
    
    let contenuASauvegarder: string;
    if (modeEdition === 'visuel') {
      // Lire le HTML directement du div contentEditable
      contenuASauvegarder = contentEditableRef.current?.innerHTML || contenuEdite[pageActuelle.slug] || '';
    } else {
      contenuASauvegarder = contenuEdite[pageActuelle.slug] || '';
    }
    
    try {
      await fetch(`${API_BASE}/pagesPlateforme/${pageActuelle.slug}`, {
        method: 'PATCH',
        credentials: 'include', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenu: contenuASauvegarder }),
      });
      
      setContenuEdite(prev => ({ ...prev, [pageActuelle.slug]: contenuASauvegarder }));
      setTexteVisuel(prev => ({ ...prev, [pageActuelle.slug]: htmlVersTexte(contenuASauvegarder) }));
      
      setMessageSauvegarde('✅ Sauvegarde avec succès !');
      setTimeout(() => setMessageSauvegarde(null), 3000);
      await fetchPages();
    } catch (error) {
      setMessageSauvegarde('❌ Erreur lors de la sauvegarde');
      setTimeout(() => setMessageSauvegarde(null), 3000);
    } finally {
      setSauvegarde(false);
    }
  }

  // NOUVELLE FONCTION : Modifier le titre d'une page existante
  async function modifierTitre() {
    const pageActuelle = pages[ongletActif];
    if (!pageActuelle || !nouveauTitre.trim()) return;
    
    setSauvegarde(true);
    try {
      await fetch(`${API_BASE}/pagesPlateforme/${pageActuelle.slug}`, {
        method: 'PATCH',
        credentials: 'include', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ titre: nouveauTitre.trim() }),
      });
      
      setMessageSauvegarde('✅ Titre modifié avec succès !');
      setEditionTitre(false);
      setNouveauTitre('');
      await fetchPages(); // Recharge la liste
      setTimeout(() => setMessageSauvegarde(null), 3000);
    } catch (error) {
      setMessageSauvegarde('❌ Erreur lors de la modification du titre');
      setTimeout(() => setMessageSauvegarde(null), 3000);
    } finally {
      setSauvegarde(false);
    }
  }

  async function toggleAfficherDansMenu() {
    const pageActuelle = pages[ongletActif];
    if (!pageActuelle) return;
    setSauvegarde(true);
    try {
      await fetch(`${API_BASE}/pagesPlateforme/${pageActuelle.slug}`, {
        method: 'PATCH',
        credentials: 'include', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ afficher_dans_menu: !pageActuelle.afficher_dans_menu }),
      });
      setMessageSauvegarde('✅ Menu mis à jour');
      setTimeout(() => setMessageSauvegarde(null), 3000);
      await fetchPages();
    } catch (error) {
      setMessageSauvegarde('❌ Erreur');
      setTimeout(() => setMessageSauvegarde(null), 3000);
    } finally {
      setSauvegarde(false);
    }
  }

  async function toggleActif() {
    const pageActuelle = pages[ongletActif];
    if (!pageActuelle) return;
    setSauvegarde(true);
    try {
      await fetch(`${API_BASE}/pagesPlateforme/${pageActuelle.slug}`, {
        method: 'PATCH',
        credentials: 'include', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ actif: !pageActuelle.actif }),
      });
      setMessageSauvegarde('✅ Statut mis à jour');
      setTimeout(() => setMessageSauvegarde(null), 3000);
      await fetchPages();
    } catch (error) {
      setMessageSauvegarde('❌ Erreur');
      setTimeout(() => setMessageSauvegarde(null), 3000);
    } finally {
      setSauvegarde(false);
    }
  }

  function insererModele() {
    const pageActuelle = pages[ongletActif];
    if (!pageActuelle) return;
    
    const modeleHtml = `<h1>${pageActuelle.titre}</h1>

<p><strong>Dernière mise à jour :</strong> ${new Date().toLocaleDateString('fr-CA')}</p>

<h2>Introduction</h2>
<p>Bienvenue sur cette page. Vous pouvez la personnaliser selon vos besoins.</p>

<h2>Section principale</h2>
<p>Ajoutez votre contenu ici...</p>

<ul>
  <li>Premier point important</li>
  <li>Deuxième point important</li>
  <li>Troisième point important</li>
</ul>

<h2>Besoin d'aide ?</h2>
<p>N'hésitez pas à contacter notre support à <a href="mailto:support@e-vend.ca">support@e-vend.ca</a></p>`;
    
    if (contenuEdite[pageActuelle.slug] && !window.confirm('Remplacer le contenu actuel par le modèle ?')) return;
    
    setContenuEdite(prev => ({ ...prev, [pageActuelle.slug]: modeleHtml }));
    setTexteVisuel(prev => ({ ...prev, [pageActuelle.slug]: htmlVersTexte(modeleHtml) }));
  }

  const savedSelectionRef = useRef<Range | null>(null);

  function ouvrirModalMedia(type: 'image' | 'video', mode: 'visuel' | 'html') {
    if (mode === 'html') {
      const ta = textareaRef.current;
      if (ta) cursorPosRef.current = { start: ta.selectionStart, end: ta.selectionEnd };
    } else {
      // Sauvegarder la sélection du navigateur AVANT que le modal vole le focus
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
      }
    }
    setMediaType(type);
    setMediaInsertMode(mode);
    setMediaUrl('');
    setMediaAlt('');
    setMediaWidth('100%');
    setUploadPreview(null);
    setShowMediaModal(true);
  }

  async function handleFileUpload(file: File) {
    if (!file) return;
    setUploading(true);
    setUploadPreview(null);

    // Aperçu local immédiat pour les images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => setUploadPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/pagesPlateforme/upload-media`, {
        method: 'POST',
        credentials: 'include', headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur upload');
      setMediaUrl(data.url);
    } catch (error: any) {
      setMessageSauvegarde(`❌ ${error.message}`);
      setTimeout(() => setMessageSauvegarde(null), 4000);
    } finally {
      setUploading(false);
    }
  }

  function insererMedia() {
    if (!mediaUrl.trim()) return;
    const pageActuelle = pages[ongletActif];
    if (!pageActuelle) return;

    const { start, end } = cursorPosRef.current;

    let balise = '';
    if (mediaType === 'image') {
      balise = `\n<img src="${mediaUrl}" alt="${mediaAlt}" style="width:${mediaWidth};max-width:100%;height:auto;display:block;margin:12px 0;" />\n`;
    } else {
      const youtubeMatch = mediaUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      const vimeoMatch = mediaUrl.match(/vimeo\.com\/(\d+)/);
      if (youtubeMatch) {
        balise = `\n<iframe width="${mediaWidth}" style="max-width:100%;aspect-ratio:16/9;display:block;margin:12px 0;" src="https://www.youtube.com/embed/${youtubeMatch[1]}" frameborder="0" allowfullscreen></iframe>\n`;
      } else if (vimeoMatch) {
        balise = `\n<iframe width="${mediaWidth}" style="max-width:100%;aspect-ratio:16/9;display:block;margin:12px 0;" src="https://player.vimeo.com/video/${vimeoMatch[1]}" frameborder="0" allowfullscreen></iframe>\n`;
      } else {
        balise = `\n<video src="${mediaUrl}" controls style="width:${mediaWidth};max-width:100%;display:block;margin:12px 0;">Votre navigateur ne supporte pas la vidéo.</video>\n`;
      }
    }

    if (mediaInsertMode === 'html') {
      const contenu = contenuEdite[pageActuelle.slug] || '';
      const nouveau = contenu.slice(0, start) + balise + contenu.slice(end);
      setContenuEdite(prev => ({ ...prev, [pageActuelle.slug]: nouveau }));
      setTimeout(() => {
        const ta = textareaRef.current;
        if (ta) {
          const nouvellePos = start + balise.length;
          ta.focus();
          ta.setSelectionRange(nouvellePos, nouvellePos);
        }
      }, 20);
    } else {
      // Mode visuel : restaurer la sélection sauvegardée, puis insérer
      const el = contentEditableRef.current;
      if (el) {
        el.focus();
        const sel = window.getSelection();
        if (sel && savedSelectionRef.current) {
          sel.removeAllRanges();
          sel.addRange(savedSelectionRef.current);
        }
        document.execCommand('insertHTML', false, balise);
        setContenuEdite(prev => ({ ...prev, [pageActuelle.slug]: el.innerHTML }));
      }
    }

    setShowMediaModal(false);
  }

  function insererBaliseHtml(avant: string, apres: string = '') {
    const ta = textareaRef.current;
    if (!ta) return;
    const pageActuelle = pages[ongletActif];
    if (!pageActuelle) return;
    
    const contenu = contenuEdite[pageActuelle.slug] || '';
    const debut = ta.selectionStart;
    const fin = ta.selectionEnd;
    const selection = contenu.slice(debut, fin);
    const nouveau = contenu.slice(0, debut) + avant + selection + apres + contenu.slice(fin);
    
    setContenuEdite(prev => ({ ...prev, [pageActuelle.slug]: nouveau }));
    
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(debut + avant.length, debut + avant.length + selection.length);
    }, 10);
  }

  async function creerPage() {
    if (!newPage.slug.trim() || !newPage.titre.trim()) {
      setMessageSauvegarde('❌ Le slug et le titre sont requis');
      setTimeout(() => setMessageSauvegarde(null), 3000);
      return;
    }
    
    const slugPropre = newPage.slug
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    setCreating(true);
    try {
      const modeleInitial = typePage === 'guide-template'
        ? `<h2>Pourquoi choisir ce template ?</h2>\n\n<p>Rédigez ici un guide détaillé — cas d'usage concrets, exemples de sites, conseils de personnalisation...</p>\n\n<h2>Idéal pour</h2>\n\n<ul>\n  <li>À compléter</li>\n</ul>`
        : `<h1>${newPage.titre}</h1>\n\n<p>Contenu à rédiger...</p>`;

      const res = await fetch(`${API_BASE}/pagesPlateforme`, {
        method: 'POST',
        credentials: 'include', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: slugPropre,
          titre: newPage.titre,
          contenu: modeleInitial,
          actif: true,
          meta_description: newPage.description,
          ordre: pages.length,
          // Un guide de template s'affiche sous la fiche du template (/templates/:id),
          // pas dans le menu général des Documents — sinon les 49 guides polluent
          // la sidebar des vraies pages (FAQ, politiques, etc.)
          afficher_dans_menu: typePage === 'guide-template' ? false : true,
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur de création');
      }
      
      setMessageSauvegarde('✅ Page créée avec succès !');
      setShowCreateModal(false);
      setNewPage({ slug: '', titre: '', description: '' });
      setTypePage('normale');
      setTemplateChoisi('');
      await fetchPages();
      
      setTimeout(() => {
        setOngletActif(pages.length);
      }, 100);
    } catch (error: any) {
      setMessageSauvegarde(`❌ ${error.message}`);
    } finally {
      setCreating(false);
      setTimeout(() => setMessageSauvegarde(null), 3000);
    }
  }

  async function supprimerPage() {
    if (!pageToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/pages/${pageToDelete.slug}`, {
        method: 'DELETE',
        credentials: 'include', headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur de suppression');
      }
      
      setMessageSauvegarde(`✅ "${pageToDelete.titre}" supprimée`);
      setPageToDelete(null);
      await fetchPages();
      
      if (ongletActif >= pages.length - 1) {
        setOngletActif(Math.max(0, pages.length - 2));
      }
    } catch (error: any) {
      setMessageSauvegarde(`❌ ${error.message}`);
    } finally {
      setDeleting(false);
      setTimeout(() => setMessageSauvegarde(null), 3000);
    }
  }

  function autoGenerateSlug() {
    const slug = newPage.titre
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setNewPage(prev => ({ ...prev, slug }));
  }

  function getIcone(titre: string) {
    if (titre.includes('FAQ')) return '❓';
    if (titre.includes('Guide')) return '📘';
    if (titre.includes('Contact')) return '📧';
    if (titre.includes('Vendre') || titre.includes('vendeur')) return '🏪';
    if (titre.includes('Acheter') || titre.includes('acheteur')) return '🛍️';
    if (titre.includes('Sécurité')) return '🔒';
    if (titre.includes('Expédition') || titre.includes('livraison')) return '🚚';
    return '📄';
  }

  // Filtrer et trier les pages par ordre alphabétique
  const pagesFiltrees = [...pages]
    .filter(page => 
      page.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.titre.localeCompare(b.titre, 'fr'));

  // Trouver l'index réel dans la liste complète pour l'onglet actif
  const getRealIndex = (filteredIndex: number) => {
    const pageCible = pagesFiltrees[filteredIndex];
    if (!pageCible) return -1;
    return pages.findIndex(p => p.id === pageCible.id);
  };

  const handleSelectPage = (filteredIndex: number) => {
    const realIndex = getRealIndex(filteredIndex);
    if (realIndex !== -1) {
      setOngletActif(realIndex);
      setModeEdition('visuel');
      setEditionTitre(false);
      setNouveauTitre('');
    }
  };

  const pageActuelle = pages[ongletActif];
  const htmlActuel = pageActuelle ? (contenuEdite[pageActuelle.slug] ?? '') : '';

  // Rendu HTML pour l'aperçu — en mode visuel, contenuEdite est déjà du HTML (sync via onInput)
  const contenuApercu = htmlActuel;

  const modifie = pageActuelle
    ? htmlActuel !== (pageActuelle.contenu || '')
    : false;

  if (loading) return (
    <div style={s.page}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
        <div style={s.spinner} />
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity:0;transform:translateX(-8px); } to { opacity:1;transform:translateX(0); } }
        @keyframes modalFade { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .toolbar-btn:hover { background: ${T.accent} !important; color: #fff !important; }
        .onglet-btn:hover { background: #f0f2f5; }
        .btn-modele:hover { background: #e8f2fb !important; }
        .mode-tab {
          transition: all 0.2s ease;
        }
        .mode-tab.active {
          background: ${T.accent} !important;
          color: white !important;
        }
        .page-content h1 { font-size:26px;font-weight:800;margin:0 0 20px;color:${T.text};border-bottom:2px solid ${T.accent};padding-bottom:10px; }
        .page-content h2 { font-size:18px;font-weight:700;margin:24px 0 10px;color:${T.text};border-bottom:1px solid ${T.border};padding-bottom:6px; }
        .page-content h3 { font-size:15px;font-weight:700;margin:16px 0 6px;color:${T.text}; }
        .page-content p { margin:0 0 12px;line-height:1.7;color:${T.textLight}; }
        .page-content ul, .page-content ol { margin:0 0 12px;padding-left:24px; }
        .page-content li { margin-bottom:4px;color:${T.textLight};line-height:1.6; }
        .page-content a { color:${T.accent};text-decoration:underline; }
        .page-content strong { color:${T.text}; }
        .page-content img { max-width:100%;height:auto;display:block;border-radius:6px;margin:12px 0; }
        .page-content video { max-width:100%;display:block;border-radius:6px;margin:12px 0; }
        .page-content iframe { max-width:100%;display:block;border-radius:6px;margin:12px 0;border:none; }
        .visuel-editor {
          min-height: 520px;
          padding: 20px;
          border: none;
          outline: none;
          font-size: 14px;
          font-family: system-ui, sans-serif;
          line-height: 1.7;
          color: ${T.text};
          resize: vertical;
          box-sizing: border-box;
          background: #fff;
          width: 100%;
        }
        .apercu-content {
          min-height: 520px;
          padding: 20px;
          background: #fff;
          overflow-y: auto;
        }
        .modal-overlay {
          position: fixed; top:0; left:0; right:0; bottom:0;
          background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000;
        }
        .search-input:focus {
          border-color: ${T.accent};
          outline: none;
        }
      `}</style>

      {/* MODAL D'INSERTION MÉDIA */}
      {showMediaModal && (
        <div className="modal-overlay" onClick={() => setShowMediaModal(false)}>
          <div style={{ ...s.modal, width: '500px' }} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalTitle}>
              {mediaType === 'image' ? '🖼️ Insérer une image' : '🎬 Insérer une vidéo'}
            </h2>

            {/* INPUT FILE CACHÉ */}
            <input
              ref={fileInputRef}
              type="file"
              accept={mediaType === 'image' ? 'image/jpeg,image/png,image/gif,image/webp' : 'video/mp4,video/webm,video/ogg'}
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = '';
              }}
            />

            {/* ZONE DRAG & DROP / PARCOURIR */}
            <div
              style={{
                border: `2px dashed ${uploading ? T.accent : T.border}`,
                borderRadius: '10px',
                padding: '24px',
                textAlign: 'center',
                marginBottom: '16px',
                background: uploading ? '#e8f2fb' : '#f8fafc',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.background = '#e8f2fb'; }}
              onDragLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = '#f8fafc'; }}
              onDrop={e => {
                e.preventDefault();
                e.currentTarget.style.borderColor = T.border;
                e.currentTarget.style.background = '#f8fafc';
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileUpload(file);
              }}
            >
              {uploading ? (
                <div>
                  <div style={{ ...s.spinner, margin: '0 auto 10px' }} />
                  <p style={{ margin: 0, fontSize: '13px', color: T.accent, fontWeight: 600 }}>Upload en cours...</p>
                </div>
              ) : uploadPreview || mediaUrl ? (
                <div>
                  {mediaType === 'image' && (uploadPreview || mediaUrl) && (
                    <img
                      src={uploadPreview || mediaUrl}
                      alt="aperçu"
                      style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'contain', borderRadius: '6px', marginBottom: '8px' }}
                    />
                  )}
                  {mediaType === 'video' && mediaUrl && (
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎬</div>
                  )}
                  <p style={{ margin: 0, fontSize: '12px', color: T.success, fontWeight: 600 }}>✅ Fichier uploadé</p>
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: T.textLight }}>Cliquer pour changer</p>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '28px', margin: '0 0 8px' }}>{mediaType === 'image' ? '🖼️' : '🎬'}</p>
                  <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: '14px', color: T.text }}>
                    Glisser-déposer ou <span style={{ color: T.accent, textDecoration: 'underline' }}>parcourir</span>
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', color: T.textLight }}>
                    {mediaType === 'image' ? 'JPG, PNG, GIF, WEBP — max 50 MB' : 'MP4, WEBM — max 50 MB'}
                  </p>
                </div>
              )}
            </div>

            {/* OU URL EXTERNE */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ flex: 1, height: '1px', background: T.border }} />
              <span style={{ fontSize: '11px', color: T.textLight, whiteSpace: 'nowrap' }}>ou coller une URL externe</span>
              <div style={{ flex: 1, height: '1px', background: T.border }} />
            </div>

            <div style={s.modalField}>
              <input
                type="url"
                style={s.modalInput}
                value={mediaUrl}
                onChange={e => { setMediaUrl(e.target.value); setUploadPreview(null); }}
                placeholder={
                  mediaType === 'image'
                    ? 'https://exemple.com/image.jpg'
                    : 'https://www.youtube.com/watch?v=...'
                }
              />
              {mediaType === 'video' && (
                <p style={s.modalHint}>✅ YouTube, Vimeo et fichiers .mp4 directs sont supportés</p>
              )}
            </div>

            {mediaType === 'image' && (
              <div style={s.modalField}>
                <label style={s.modalLabel}>Texte alternatif (alt)</label>
                <input
                  type="text"
                  style={s.modalInput}
                  value={mediaAlt}
                  onChange={e => setMediaAlt(e.target.value)}
                  placeholder="Description de l'image pour l'accessibilité"
                />
              </div>
            )}

            <div style={s.modalField}>
              <label style={s.modalLabel}>Largeur</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['100%', '75%', '50%', '300px', '500px'].map(w => (
                  <button
                    key={w}
                    onClick={() => setMediaWidth(w)}
                    style={{
                      padding: '6px 12px',
                      border: `1px solid ${mediaWidth === w ? T.accent : T.border}`,
                      borderRadius: '6px',
                      background: mediaWidth === w ? '#e8f2fb' : '#fff',
                      color: mediaWidth === w ? T.accent : T.text,
                      fontSize: '12px',
                      fontWeight: mediaWidth === w ? 700 : 400,
                      cursor: 'pointer',
                    }}
                  >
                    {w}
                  </button>
                ))}
                <input
                  type="text"
                  style={{ ...s.modalInput, width: '90px', padding: '6px 10px' }}
                  value={mediaWidth}
                  onChange={e => setMediaWidth(e.target.value)}
                  placeholder="ex: 400px"
                />
              </div>
            </div>

            <div style={s.modalButtons}>
              <button style={s.modalBtnCancel} onClick={() => setShowMediaModal(false)}>
                Annuler
              </button>
              <button
                style={{ ...s.modalBtnCreate, opacity: (!mediaUrl.trim() || uploading) ? 0.5 : 1 }}
                onClick={insererMedia}
                disabled={!mediaUrl.trim() || uploading}
              >
                {uploading ? '⏳ Upload...' : mediaType === 'image' ? '🖼️ Insérer l\'image' : '🎬 Insérer la vidéo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CRÉATION */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalTitle}>➕ Créer une nouvelle page</h2>

            {/* Type de page — normale ou guide lié à un template */}
            <div style={s.modalField}>
              <label style={s.modalLabel}>Type de page</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button"
                  onClick={() => { setTypePage('normale'); setTemplateChoisi(''); setNewPage({ slug: '', titre: '', description: '' }); }}
                  style={{ flex: 1, padding: '9px', borderRadius: 8, border: `1.5px solid ${typePage === 'normale' ? T.accent : T.border}`, background: typePage === 'normale' ? '#e8f2fb' : '#fff', color: typePage === 'normale' ? T.accent : T.textLight, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  📄 Page normale
                </button>
                <button type="button"
                  onClick={() => { setTypePage('guide-template'); setNewPage({ slug: '', titre: '', description: '' }); }}
                  style={{ flex: 1, padding: '9px', borderRadius: 8, border: `1.5px solid ${typePage === 'guide-template' ? T.accent : T.border}`, background: typePage === 'guide-template' ? '#e8f2fb' : '#fff', color: typePage === 'guide-template' ? T.accent : T.textLight, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  🧩 Guide de template
                </button>
              </div>
            </div>

            {typePage === 'guide-template' ? (
              <div style={s.modalField}>
                <label style={s.modalLabel}>Template lié *</label>
                <select
                  style={s.modalInput}
                  value={templateChoisi}
                  onChange={e => {
                    const id = e.target.value;
                    setTemplateChoisi(id);
                    const tpl = TEMPLATES.find(t => t.id === id);
                    setNewPage({
                      slug: id ? `template-${id}` : '',
                      titre: tpl ? `Guide — ${tpl.nom}` : '',
                      description: tpl ? tpl.description : '',
                    });
                  }}>
                  <option value="">Choisir un template...</option>
                  {TEMPLATES.map(t => {
                    const existe = pages.some(p => p.slug === `template-${t.id}`);
                    return (
                      <option key={t.id} value={t.id}>
                        {existe ? '✅ ' : ''}{t.nom} ({t.id})
                      </option>
                    );
                  })}
                </select>
                <p style={s.modalHint}>
                  {templateChoisi
                    ? `L'URL sera : /templates/${templateChoisi} — ✅ = un guide existe déjà pour ce template`
                    : "✅ dans la liste = ce template a déjà un guide. Vous pouvez quand même le sélectionner pour voir/modifier son contenu existant depuis la liste des pages."}
                </p>
              </div>
            ) : (
              <div style={s.modalField}>
                <label style={s.modalLabel}>Titre *</label>
                <input
                  type="text"
                  style={s.modalInput}
                  value={newPage.titre}
                  onChange={e => setNewPage(prev => ({ ...prev, titre: e.target.value }))}
                  placeholder="Ex: Guide des retours, FAQ vendeurs, etc."
                />
              </div>
            )}
            
            <div style={s.modalField}>
              <label style={s.modalLabel}>
                Slug (URL) *
                {typePage === 'normale' && (
                  <button type="button" onClick={autoGenerateSlug} style={s.modalAutoSlug}>
                    🔄 Auto
                  </button>
                )}
              </label>
              <input
                type="text"
                style={{ ...s.modalInput, ...(typePage === 'guide-template' ? { background: '#f0f2f5', color: T.textLight } : {}) }}
                value={newPage.slug}
                disabled={typePage === 'guide-template'}
                onChange={e => {
                  const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                  setNewPage(prev => ({ ...prev, slug: val }));
                }}
                placeholder="guide-des-retours"
              />
              <p style={s.modalHint}>
                L'URL sera : {typePage === 'guide-template' ? '/templates/' : '/documents/'}{newPage.slug.replace('template-', '') || '...'}
              </p>
            </div>
            
            <div style={s.modalField}>
              <label style={s.modalLabel}>Description (meta)</label>
              <textarea
                style={s.modalTextarea}
                value={newPage.description}
                onChange={e => setNewPage(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brève description pour le SEO..."
                rows={2}
              />
            </div>
            
            <div style={s.modalButtons}>
              <button
                style={s.modalBtnCancel}
                onClick={() => { setShowCreateModal(false); setTypePage('normale'); setTemplateChoisi(''); }}
              >
                Annuler
              </button>
              <button
                style={s.modalBtnCreate}
                onClick={creerPage}
                disabled={creating || !newPage.slug || !newPage.titre || (typePage === 'guide-template' && !templateChoisi)}
              >
                {creating ? 'Création...' : '✨ Créer la page'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMATION SUPPRESSION */}
      {pageToDelete && (
        <div className="modal-overlay" onClick={() => setPageToDelete(null)}>
          <div style={{...s.modal, maxWidth: '400px'}} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalTitle}>🗑️ Supprimer cette page ?</h2>
            <p style={{ margin: '16px 0', color: T.textLight }}>
              Êtes-vous sûr de vouloir supprimer <strong>"{pageToDelete.titre}"</strong> ?
              Cette action est irréversible.
            </p>
            <div style={s.modalButtons}>
              <button
                style={s.modalBtnCancel}
                onClick={() => setPageToDelete(null)}
              >
                Annuler
              </button>
              <button
                style={{...s.modalBtnCreate, background: T.danger, borderColor: T.danger}}
                onClick={supprimerPage}
                disabled={deleting}
              >
                {deleting ? 'Suppression...' : '🗑️ Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EN-TÊTE ── */}
      <div style={s.topBar}>
        <div>
          <h1 style={s.titre}>📄 Pages de la plateforme</h1>
          <p style={s.sousTitre}>
            Gestion des guides, FAQ et pages d'information de e-Vend
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            style={s.btnCreate}
          >
            ➕ Nouvelle page
          </button>
          {messageSauvegarde && (
            <span style={{
              fontSize: '13px',
              color: messageSauvegarde.includes('succès') ? T.success : T.danger,
              fontWeight: 600,
              background: messageSauvegarde.includes('succès') ? '#f0fdf4' : '#fef2f2',
              padding: '8px 14px',
              borderRadius: '8px',
              border: `1px solid ${messageSauvegarde.includes('succès') ? '#bbf7d0' : '#fecaca'}`
            }}>
              {messageSauvegarde}
            </span>
          )}
        </div>
      </div>

      <div style={s.layout}>
        {/* ── SIDEBAR AVEC RECHERCHE ET TRI ALPHABÉTIQUE ── */}
        <div style={s.sidebar}>
          <p style={s.sidebarTitre}>📑 Toutes les pages ({pagesFiltrees.length})</p>
          
          {/* Barre de recherche */}
          <div style={s.searchContainer}>
            <input
              type="text"
              className="search-input"
              placeholder="🔍 Rechercher par titre ou slug..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={s.searchInput}
            />
            {searchTerm && (
              <button
                style={s.searchClear}
                onClick={() => setSearchTerm('')}
              >
                ✕
              </button>
            )}
          </div>

          {pagesFiltrees.length === 0 && searchTerm && (
            <div style={{ padding: '20px', textAlign: 'center', color: T.textLight }}>
              <p>Aucun résultat pour "{searchTerm}"</p>
            </div>
          )}
          
          {pagesFiltrees.length === 0 && !searchTerm && (
            <div style={{ padding: '20px', textAlign: 'center', color: T.textLight }}>
              <p>Aucune page pour le moment.</p>
              <button onClick={() => setShowCreateModal(true)} style={s.btnCreateSmall}>
                ➕ Créer votre première page
              </button>
            </div>
          )}
          
          {pagesFiltrees.map((page, filteredIdx) => {
            const realIdx = pages.findIndex(p => p.id === page.id);
            const aduContenu = contenuEdite[page.slug]?.trim().length > 0;
            const estActif = realIdx === ongletActif;
            return (
              <button
                key={page.id}
                className="onglet-btn"
                style={{
                  ...s.ongletBtn,
                  ...(estActif ? s.ongletBtnActif : {}),
                }}
                onClick={() => handleSelectPage(filteredIdx)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                  <span style={{ fontSize: '18px' }}>{getIcone(page.titre)}</span>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{
                      fontSize: '12px',
                      fontWeight: estActif ? 700 : 500,
                      color: estActif ? T.accent : T.text,
                      margin: 0,
                      lineHeight: 1.3
                    }}>
                      {page.titre}
                    </p>
                    <p style={{ fontSize: '10px', color: T.textLight, margin: '2px 0 0' }}>
                      /documents/{page.slug}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                  <span style={{
                    fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px',
                    background: aduContenu ? '#f0fdf4' : '#f3f4f6',
                    color: aduContenu ? T.success : T.textLight,
                  }}>
                    {aduContenu ? '✓ Publiée' : '—'}
                  </span>
                  {!page.actif && (
                    <span style={{
                      fontSize: '8px', fontWeight: 700, padding: '2px 5px', borderRadius: '10px',
                      background: '#fee2e2', color: T.danger,
                    }}>
                      Inactive
                    </span>
                  )}
                  {estActif && <span style={{ fontSize: '10px', color: T.accent }}>▶</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── ÉDITEUR PRINCIPAL ── */}
        <div style={s.editeurWrap}>
          {pageActuelle ? (
            <div style={s.card} key={pageActuelle.id}>
              {/* Header éditeur - MODIFIÉ POUR PERMETTRE L'ÉDITION DU TITRE */}
              <div style={s.editeurHeader}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>{getIcone(pageActuelle.titre)}</span>
                    <div style={{ flex: 1 }}>
                      {editionTitre ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <input
                            type="text"
                            value={nouveauTitre}
                            onChange={e => setNouveauTitre(e.target.value)}
                            placeholder={pageActuelle.titre}
                            style={{
                              padding: '6px 12px',
                              border: `1px solid ${T.accent}`,
                              borderRadius: '8px',
                              fontSize: '17px',
                              fontWeight: 800,
                              color: T.text,
                              outline: 'none',
                              flex: 1,
                              minWidth: '200px',
                            }}
                            autoFocus
                          />
                          <button
                            onClick={modifierTitre}
                            disabled={sauvegarde || !nouveauTitre.trim()}
                            style={{
                              padding: '6px 16px',
                              background: T.success,
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: '#fff',
                              cursor: sauvegarde || !nouveauTitre.trim() ? 'not-allowed' : 'pointer',
                              opacity: sauvegarde || !nouveauTitre.trim() ? 0.5 : 1,
                            }}
                          >
                            💾 Enregistrer
                          </button>
                          <button
                            onClick={() => {
                              setEditionTitre(false);
                              setNouveauTitre('');
                            }}
                            style={{
                              padding: '6px 16px',
                              background: '#f0f2f5',
                              border: `1px solid ${T.border}`,
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: T.text,
                              cursor: 'pointer',
                            }}
                          >
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h2 style={s.editeurTitre}>{pageActuelle.titre}</h2>
                          <button
                            onClick={() => {
                              setEditionTitre(true);
                              setNouveauTitre(pageActuelle.titre);
                            }}
                            style={{
                              padding: '4px 10px',
                              background: '#f0f2f5',
                              border: `1px solid ${T.border}`,
                              borderRadius: '6px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              color: T.accent,
                            }}
                          >
                            ✏️ Modifier
                          </button>
                        </div>
                      )}
                      <p style={s.editeurDesc}>
                        Slug : /documents/{pageActuelle.slug}
                        {pageActuelle.meta_description && ` — ${pageActuelle.meta_description}`}
                      </p>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {pageActuelle.updated_at && (
                    <span style={{ fontSize: '11px', color: T.textLight }}>
                      Modifiée : {new Date(pageActuelle.updated_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  <button
                    className="btn-modele"
                    style={{
                      ...s.btnModele,
                      background: pageActuelle.afficher_dans_menu ? '#dcfce7' : '#fef2f2',
                      borderColor: pageActuelle.afficher_dans_menu ? '#86efac' : '#fecaca',
                      color: pageActuelle.afficher_dans_menu ? '#166534' : '#991b1b',
                    }}
                    onClick={toggleAfficherDansMenu}
                    disabled={sauvegarde}
                  >
                    {pageActuelle.afficher_dans_menu ? '✅ Visible dans le menu' : '❌ Caché dans le menu'}
                  </button>
                  <button
                    className="btn-modele"
                    style={{
                      ...s.btnModele,
                      background: pageActuelle.actif ? '#dcfce7' : '#fef2f2',
                      borderColor: pageActuelle.actif ? '#86efac' : '#fecaca',
                      color: pageActuelle.actif ? '#166534' : '#991b1b',
                    }}
                    onClick={toggleActif}
                    disabled={sauvegarde}
                  >
                    {pageActuelle.actif ? '🟢 Active' : '🔴 Inactive'}
                  </button>
                  <button className="btn-modele" style={s.btnModele} onClick={insererModele}>
                    📄 Insérer un modèle
                  </button>
                  <button
                    style={{ ...s.btnDelete }}
                    onClick={() => setPageToDelete(pageActuelle)}
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>

              {/* TRIPLE ONGLET : VISUEL / HTML / APERÇU */}
              <div style={s.modeTabs}>
                <button
                  className={`mode-tab ${modeEdition === 'visuel' ? 'active' : ''}`}
                  style={modeEdition === 'visuel' ? s.modeTabActif : s.modeTab}
                  onClick={() => {
                    if (modeEdition === 'html') {
                      // Quand on revient au visuel depuis HTML, contenuEdite est déjà à jour
                    }
                    setModeEdition('visuel');
                  }}
                >
                  ✏️ Visuel
                </button>
                <button
                  className={`mode-tab ${modeEdition === 'html' ? 'active' : ''}`}
                  style={modeEdition === 'html' ? s.modeTabActif : s.modeTab}
                  onClick={() => {
                    if (modeEdition === 'visuel') {
                      // Synchroniser le HTML depuis le contentEditable avant de switcher
                      const html = contentEditableRef.current?.innerHTML || contenuEdite[pageActuelle.slug] || '';
                      setContenuEdite(prev => ({ ...prev, [pageActuelle.slug]: html }));
                    }
                    setModeEdition('html');
                  }}
                >
                  {'</>'} HTML
                </button>
                <button
                  className={`mode-tab ${modeEdition === 'apercu' ? 'active' : ''}`}
                  style={modeEdition === 'apercu' ? s.modeTabActif : s.modeTab}
                  onClick={() => {
                    if (modeEdition === 'visuel') {
                      const html = contentEditableRef.current?.innerHTML || contenuEdite[pageActuelle.slug] || '';
                      setContenuEdite(prev => ({ ...prev, [pageActuelle.slug]: html }));
                    }
                    setModeEdition('apercu');
                  }}
                >
                  👁️ Aperçu
                </button>
              </div>

              {/* ZONE D'ÉDITION - MODE VISUEL */}
              {modeEdition === 'visuel' && (
                <div style={s.editeurCorps}>
                  <div style={s.toolbarVisuel}>
                    <span style={s.toolbarLabel}>Formatage :</span>
                    <button
                      style={s.toolbarBtn}
                      onClick={() => { document.execCommand('bold'); contentEditableRef.current?.focus(); }}
                      title="Gras"
                    >
                      <strong>G</strong>
                    </button>
                    <button
                      style={s.toolbarBtn}
                      onClick={() => { document.execCommand('italic'); contentEditableRef.current?.focus(); }}
                      title="Italique"
                    >
                      <em>I</em>
                    </button>
                    <button
                      style={s.toolbarBtn}
                      onClick={() => { document.execCommand('insertUnorderedList'); contentEditableRef.current?.focus(); }}
                      title="Liste à puces"
                    >
                      • Liste
                    </button>
                    <div style={s.toolbarSep} />
                    <button
                      style={{ ...s.toolbarBtn, background: '#f0f9ff', borderColor: '#bae6fd', color: '#0369a1' }}
                      onClick={() => ouvrirModalMedia('image', 'visuel')}
                      title="Insérer une image"
                    >
                      🖼️ Photo
                    </button>
                    <button
                      style={{ ...s.toolbarBtn, background: '#fdf4ff', borderColor: '#e9d5ff', color: '#7c3aed' }}
                      onClick={() => ouvrirModalMedia('video', 'visuel')}
                      title="Insérer une vidéo"
                    >
                      🎬 Vidéo
                    </button>
                    <div style={s.toolbarSep} />
                    <span style={{ fontSize: '11px', color: T.textLight }}>
                      Écrivez et les images s'affichent en place
                    </span>
                  </div>
                  <div
                    ref={contentEditableRef}
                    contentEditable
                    suppressContentEditableWarning
                    className="visuel-editor page-content"
                    style={{
                      minHeight: '520px',
                      padding: '20px',
                      border: 'none',
                      outline: 'none',
                      fontSize: '14px',
                      fontFamily: 'system-ui, sans-serif',
                      lineHeight: '1.7',
                      color: T.text,
                      background: '#fff',
                      overflowY: 'auto',
                      boxSizing: 'border-box',
                    }}
                    onInput={() => {
                      const html = contentEditableRef.current?.innerHTML || '';
                      setContenuEdite(prev => ({ ...prev, [pageActuelle.slug]: html }));
                    }}
                    // NE PAS utiliser dangerouslySetInnerHTML ici (reset le curseur à chaque render)
                    // Le contenu initial est injecté via useEffect ci-dessous
                  />
                </div>
              )}

              {/* ZONE D'ÉDITION - MODE HTML */}
              {modeEdition === 'html' && (
                <div style={s.editeurCorps}>
                  <div style={s.toolbar}>
                    <span style={s.toolbarLabel}>Balises HTML :</span>
                    {[
                      { label: 'G', avant: '<strong>', apres: '</strong>', title: 'Gras' },
                      { label: 'I', avant: '<em>', apres: '</em>', title: 'Italique' },
                      { label: 'H1', avant: '<h1>', apres: '</h1>', title: 'Titre principal' },
                      { label: 'H2', avant: '<h2>', apres: '</h2>', title: 'Titre section' },
                      { label: 'H3', avant: '<h3>', apres: '</h3>', title: 'Sous-titre' },
                      { label: '🔗', avant: '<a href="">', apres: '</a>', title: 'Lien' },
                      { label: '📋', avant: '<ul>\n  <li>', apres: '</li>\n</ul>', title: 'Liste à puces' },
                      { label: '1.', avant: '<ol>\n  <li>', apres: '</li>\n</ol>', title: 'Liste numérotée' },
                      { label: '💬', avant: '<blockquote>', apres: '</blockquote>', title: 'Citation' },
                      { label: '—', avant: '\n<hr />\n', apres: '', title: 'Séparateur' },
                    ].map(btn => (
                      <button
                        key={btn.label}
                        className="toolbar-btn"
                        style={s.toolbarBtn}
                        onClick={() => insererBaliseHtml(btn.avant, btn.apres)}
                        title={btn.title}
                      >
                        {btn.label}
                      </button>
                    ))}
                    <div style={s.toolbarSep} />
                    <button
                      style={{ ...s.toolbarBtn, background: '#f0f9ff', borderColor: '#bae6fd', color: '#0369a1' }}
                      onClick={() => ouvrirModalMedia('image', 'html')}
                      title="Insérer une image"
                    >
                      🖼️ Photo
                    </button>
                    <button
                      style={{ ...s.toolbarBtn, background: '#fdf4ff', borderColor: '#e9d5ff', color: '#7c3aed' }}
                      onClick={() => ouvrirModalMedia('video', 'html')}
                      title="Insérer une vidéo"
                    >
                      🎬 Vidéo
                    </button>
                    <div style={s.toolbarSep} />
                    <span style={{ fontSize: '11px', color: T.textLight }}>HTML supporté</span>
                  </div>
                  <textarea
                    ref={textareaRef}
                    style={s.textarea}
                    value={htmlActuel}
                    onChange={e => setContenuEdite(prev => ({ ...prev, [pageActuelle.slug]: e.target.value }))}
                    placeholder={`<h1>${pageActuelle.titre}</h1>

<p>Rédigez votre contenu en HTML ici...</p>

<ul>
  <li>Élément 1</li>
  <li>Élément 2</li>
</ul>`}
                    spellCheck={false}
                  />
                </div>
              )}

              {/* ZONE D'APERÇU */}
              {modeEdition === 'apercu' && (
                <div style={s.editeurCorps}>
                  <div style={s.toolbarVisuel}>
                    <span style={s.toolbarLabel}>🔍 Aperçu visuel</span>
                    <div style={s.toolbarSep} />
                    <span style={{ fontSize: '11px', color: T.textLight }}>
                      Ce que verront les visiteurs
                    </span>
                  </div>
                  <div 
                    className="page-content apercu-content"
                    style={s.apercuContent}
                    dangerouslySetInnerHTML={{ __html: contenuApercu || '<p style="color: #999; text-align: center; padding: 40px;">Aucun contenu à afficher</p>' }}
                  />
                </div>
              )}

              {/* Footer avec sauvegarde */}
              <div style={s.editeurFooter}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: T.textLight }}>
                    {htmlActuel.length} caractères
                  </span>
                  {modifie && modeEdition !== 'apercu' && (
                    <span style={{ fontSize: '12px', color: T.warning, fontWeight: 600 }}>
                      ● Modifications non sauvegardées
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    style={{
                      ...s.btnSauvegarder,
                      opacity: sauvegarde ? 0.5 : 1,
                      cursor: sauvegarde ? 'not-allowed' : 'pointer',
                    }}
                    onClick={sauvegarder}
                    disabled={sauvegarde}
                  >
                    {sauvegarde ? '⏳ Sauvegarde...' : '💾 Enregistrer'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={s.card}>
              <div style={{ textAlign: 'center', padding: '80px', color: T.textLight }}>
                <p style={{ fontSize: '48px', marginBottom: '16px' }}>📄</p>
                <p>Aucune page disponible. Cliquez sur "Nouvelle page" pour commencer.</p>
                <button onClick={() => setShowCreateModal(true)} style={{ ...s.btnCreate, marginTop: '20px' }}>
                  ➕ Créer votre première page
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: '24px', background: '#f0f2f5', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  titre: { fontSize: '22px', fontWeight: 800, color: T.text, margin: '0 0 4px' },
  sousTitre: { fontSize: '13px', color: T.textLight, margin: 0 },

  layout: { display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', alignItems: 'start' },

  sidebar: { background: T.card, border: `1px solid ${T.border}`, borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', position: 'sticky', top: '20px', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' },
  sidebarTitre: { fontSize: '11px', fontWeight: 700, color: T.textLight, textTransform: 'uppercase', letterSpacing: '1px', padding: '14px 16px 10px', margin: 0, borderBottom: `1px solid ${T.border}` },
  
  searchContainer: { position: 'relative', padding: '12px 16px', borderBottom: `1px solid ${T.border}` },
  searchInput: { width: '100%', padding: '8px 30px 8px 12px', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '13px', background: '#fff' },
  searchClear: { position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.textLight, fontSize: '14px' },
  
  ongletBtn: { width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: `1px solid ${T.border}`, transition: 'background 0.15s', justifyContent: 'space-between', textAlign: 'left' },
  ongletBtnActif: { background: '#e8f2fb', borderLeft: `3px solid ${T.accent}` },

  editeurWrap: {},
  card: { background: T.card, border: `1px solid ${T.border}`, borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', animation: 'slideIn 0.2s ease' },

  editeurHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '18px 22px', borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap', gap: '12px', background: '#f8fafc' },
  editeurTitre: { fontSize: '17px', fontWeight: 800, color: T.text, margin: '0 0 2px' },
  editeurDesc: { fontSize: '12px', color: T.textLight, margin: 0 },

  modeTabs: { display: 'flex', borderBottom: `1px solid ${T.border}`, background: '#fff' },
  modeTab: { padding: '12px 24px', border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 500, cursor: 'pointer', color: T.textLight, transition: 'all 0.15s' },
  modeTabActif: { padding: '12px 24px', border: 'none', background: T.accent, fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#fff' },

  btnModele: { padding: '7px 14px', background: '#f0f2f5', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: T.text, fontWeight: 500, transition: 'background 0.15s' },
  btnDelete: { padding: '7px 14px', background: '#fee2e2', border: `1px solid #fecaca`, borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: T.danger, fontWeight: 500 },

  editeurCorps: {},
  toolbar: { display: 'flex', alignItems: 'center', gap: '4px', padding: '10px 16px', borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap', background: '#f8fafc' },
  toolbarVisuel: { display: 'flex', alignItems: 'center', gap: '4px', padding: '10px 16px', borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap', background: '#f8fafc' },
  toolbarLabel: { fontSize: '11px', color: T.textLight, fontWeight: 600, marginRight: '4px', whiteSpace: 'nowrap' },
  toolbarBtn: { padding: '4px 8px', border: `1px solid ${T.border}`, borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: T.text, transition: 'all 0.15s', minWidth: '28px' },
  toolbarSep: { width: '1px', height: '20px', background: T.border, margin: '0 8px' },

  textarea: { width: '100%', minHeight: '520px', padding: '20px', border: 'none', outline: 'none', fontSize: '13px', fontFamily: 'monospace', lineHeight: '1.7', color: T.text, resize: 'vertical', boxSizing: 'border-box', background: '#fff' } as React.CSSProperties,
  textareaVisuel: { minHeight: '520px', padding: '20px', border: 'none', outline: 'none', fontSize: '14px', fontFamily: 'system-ui, sans-serif', lineHeight: '1.7', color: T.text, resize: 'vertical', boxSizing: 'border-box', background: '#fff', width: '100%' } as React.CSSProperties,
  apercuContent: { minHeight: '520px', padding: '20px', background: '#fff', overflowY: 'auto' } as React.CSSProperties,

  editeurFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: `1px solid ${T.border}`, background: '#f8fafc' },

  btnSauvegarder: { padding: '9px 22px', background: T.accent, border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, color: '#fff', transition: 'opacity 0.15s', cursor: 'pointer' },
  btnCreate: { padding: '9px 22px', background: T.success, border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, color: '#fff', cursor: 'pointer' },
  btnCreateSmall: { padding: '8px 16px', background: T.success, border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: '#fff', cursor: 'pointer', marginTop: '12px' },

  spinner: { width: '32px', height: '32px', border: `3px solid ${T.border}`, borderTop: `3px solid ${T.accent}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' },

  // Modal styles
  modal: { background: T.card, borderRadius: '16px', padding: '24px', width: '480px', maxWidth: '90vw', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', animation: 'modalFade 0.2s ease' },
  modalTitle: { fontSize: '18px', fontWeight: 700, color: T.text, margin: '0 0 20px' },
  modalField: { marginBottom: '18px' },
  modalLabel: { display: 'block', fontSize: '12px', fontWeight: 600, color: T.textLight, marginBottom: '6px' },
  modalInput: { width: '100%', padding: '10px 12px', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '14px', outline: 'none', background: '#fff' },
  modalTextarea: { width: '100%', padding: '10px 12px', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', resize: 'vertical' },
  modalHint: { fontSize: '11px', color: T.textLight, marginTop: '4px' },
  modalAutoSlug: { marginLeft: '8px', fontSize: '10px', background: '#f0f2f5', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' },
  modalButtons: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' },
  modalBtnCancel: { padding: '8px 16px', background: '#f0f2f5', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' },
  modalBtnCreate: { padding: '8px 20px', background: T.success, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#fff', cursor: 'pointer' },
};