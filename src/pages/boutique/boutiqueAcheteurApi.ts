// CHEMIN : src/pages/boutique/boutiqueAcheteurApi.ts
// e-Vend Studio — Appels de l'ACHETEUR vers l'API des templates boutique (solo) : /api/boutique/acheteur/<gestionnaire>/…
// Partagé par PanierBoutique, CaisseBoutique et CommandeBoutique. Ne sert JAMAIS au multivendeur.
// Connexion : le compte acheteur du MV est réutilisé (cookie mv_token_<gid>, ou en-tête si le jeton est gardé dans le navigateur).

export interface ReponseAcheteur { ok: boolean; status: number; data: any; }

function jeton(gid: number): string | null {
  try { return localStorage.getItem(`mv_token_${gid}`); } catch (e) { return null; }
}

export async function ba(gid: number, chemin: string, options: { method?: string; body?: any } = {}): Promise<ReponseAcheteur> {
  const headers: Record<string, string> = {};
  const t = jeton(gid);
  if (t) headers.Authorization = `Bearer ${t}`;
  const init: RequestInit = { method: options.method || 'GET', credentials: 'include', headers };
  if (options.body !== undefined) { headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(options.body); }
  try {
    const r = await fetch(`/api/boutique/acheteur/${gid}${chemin}`, init);
    let data: any = {};
    try { data = await r.json(); } catch (e) { data = {}; }
    return { ok: r.ok, status: r.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: { message: 'Erreur réseau. Vérifiez votre connexion.' } };
  }
}

export function messageAcheteur(r: ReponseAcheteur): string {
  return (r.data && (r.data.message || r.data.error)) || 'Une erreur est survenue. Réessayez.';
}

export function argent(n: number | string | null | undefined, devise?: string): string {
  const v = Number(n);
  if (!Number.isFinite(v)) return '';
  const txt = v.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return devise === 'USD' ? `${txt} $ US` : `${txt} $`;
}

// À appeler depuis la page d'une annonce (bouton « Ajouter au panier »)
export function ajouterAuPanier(gid: number, produitId: number, quantite: number = 1, variante: string = ''): Promise<ReponseAcheteur> {
  return ba(gid, '/panier', { method: 'POST', body: { produit_id: produitId, quantite, variante } });
}

export const PROVINCES: { code: string; nom: string }[] = [
  { code: 'AB', nom: 'Alberta' }, { code: 'BC', nom: 'Colombie-Britannique' }, { code: 'MB', nom: 'Manitoba' }, { code: 'NB', nom: 'Nouveau-Brunswick' },
  { code: 'NL', nom: 'Terre-Neuve-et-Labrador' }, { code: 'NS', nom: 'Nouvelle-Écosse' }, { code: 'NT', nom: 'Territoires du Nord-Ouest' }, { code: 'NU', nom: 'Nunavut' },
  { code: 'ON', nom: 'Ontario' }, { code: 'PE', nom: 'Île-du-Prince-Édouard' }, { code: 'QC', nom: 'Québec' }, { code: 'SK', nom: 'Saskatchewan' }, { code: 'YT', nom: 'Yukon' },
];

export function paramUrl(nom: string): string | null {
  try { return new URLSearchParams(window.location.search).get(nom); } catch (e) { return null; }
}