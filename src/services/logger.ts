// src/services/logger.ts

export type LogSeverite = 'info' | 'succes' | 'avertissement' | 'erreur' | 'critique';
export type LogCategorie = 'admin' | 'vendeur' | 'acheteur' | 'finance' | 'systeme' | 'api';

export interface LogEntry {
  id: number;
  date: string;
  categorie: LogCategorie;
  severite: LogSeverite;
  action: string;
  details: string;
  utilisateur?: string;
  ip?: string;
  metadata?: Record<string, string>;
}

class Logger {
  private logs: LogEntry[] = [];
  private listeners: (() => void)[] = [];

  //
  add(entry: Omit<LogEntry, 'id' | 'date'>) {
    const newEntry: LogEntry = {
      ...entry,
      id: Date.now() + Math.floor(Math.random() * 1000),
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    
    this.logs = [newEntry, ...this.logs].slice(0, 1000); // Garde 1000 logs max
    this.notifyListeners();
    
    // Affiche aussi dans la console pour le debug
    console.log(`[${newEntry.categorie}] ${newEntry.action}:`, newEntry.details);
    
    return newEntry;
  }

  // Récupérer tous les logs
  getAll(): LogEntry[] {
    return [...this.logs];
  }

  //
  addListener(callback: () => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(cb => cb());
  }

  // Nettoyer les logs (pour tests)
  clear() {
    this.logs = [];
    this.notifyListeners();
  }
}

export const logger = new Logger();

// Fonctions d'aide pour logger facilement
export const log = {
  admin: (action: string, details: string, metadata?: Record<string, string>) =>
    logger.add({ categorie: 'admin', severite: 'info', action, details, metadata }),
  
  vendeur: (action: string, details: string, utilisateur?: string, metadata?: Record<string, string>) =>
    logger.add({ categorie: 'vendeur', severite: 'info', action, details, utilisateur, metadata }),
  
  erreur: (action: string, details: string, metadata?: Record<string, string>) =>
    logger.add({ categorie: 'systeme', severite: 'erreur', action, details, metadata }),
  
  api: (method: string, url: string, status: number, metadata?: Record<string, string>) =>
    logger.add({ 
      categorie: 'api', 
      severite: status >= 500 ? 'erreur' : status >= 400 ? 'avertissement' : 'info',
      action: `${method} ${url}`,
      details: `Statut: ${status}`,
      metadata 
    }),
  
  succes: (action: string, details: string, categorie: LogCategorie = 'systeme') =>
    logger.add({ categorie, severite: 'succes', action, details }),
};
