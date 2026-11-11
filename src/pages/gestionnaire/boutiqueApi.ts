// CHEMIN : src/pages/gestionnaire/boutiqueApi.ts
// e-Vend Studio — Petit utilitaire d'appel à l'API des templates boutique (solo) : /api/boutique/gestionnaire/…
// Partagé par les pages Boutique* (annonces, plan, paiements). Ne sert JAMAIS au multivendeur.

export const BQ = '/api/boutique/gestionnaire';

export interface ReponseBq {
  ok: boolean;
  status: number;
  data: any;
}

function jeton(): string | null {
  try { return localStorage.getItem('token'); } catch (e) { return null; }
}

export async function bq(chemin: string, options: { method?: string; body?: any } = {}): Promise<ReponseBq> {
  const headers: Record<string, string> = {};
  const t = jeton();
  if (t) headers.Authorization = `Bearer ${t}`;
  const init: RequestInit = { method: options.method || 'GET', credentials: 'include', headers };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(options.body);
  }
  try {
    const r = await fetch(BQ + chemin, init);
    let data: any = {};
    try { data = await r.json(); } catch (e) { data = {}; }
    return { ok: r.ok, status: r.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: { error: 'Erreur réseau. Vérifiez votre connexion.' } };
  }
}

export function messageErreur(r: ReponseBq): string {
  return (r.data && (r.data.error || r.data.message)) || 'Une erreur est survenue. Réessayez.';
}

export function formaterArgent(n: number | string | null | undefined, devise?: string): string {
  const v = Number(n);
  if (!Number.isFinite(v)) return '';
  const txt = v.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return devise === 'USD' ? `${txt} $ US` : `${txt} $`;
}