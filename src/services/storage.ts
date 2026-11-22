import { AIProviderConfig, Book, ThemeMode, UILanguage } from '../types/book';

const DB_NAME = 'aibook_studio_db';
const DB_VERSION = 1;
const BOOKS_STORE = 'books';

const SETTINGS_KEY = 'aibook_ai_config';
const THEME_KEY = 'aibook_theme';
const LANG_KEY = 'aibook_ui_lang';

/**
 * StorageAdapter interface allows seamless migration in Phase 2
 * from browser IndexedDB to a remote server/database.
 */
export interface StorageAdapter {
  listBooks(): Promise<Book[]>;
  getBook(id: string): Promise<Book | undefined>;
  saveBook(book: Book): Promise<void>;
  deleteBook(id: string): Promise<void>;
  importBooks(books: Book[]): Promise<void>;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(BOOKS_STORE)) {
        db.createObjectStore(BOOKS_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

class IndexedDBStorage implements StorageAdapter {
  async listBooks(): Promise<Book[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(BOOKS_STORE, 'readonly');
      const store = tx.objectStore(BOOKS_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const books = (req.result as Book[]).sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        resolve(books);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getBook(id: string): Promise<Book | undefined> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(BOOKS_STORE, 'readonly');
      const req = tx.objectStore(BOOKS_STORE).get(id);
      req.onsuccess = () => resolve(req.result as Book | undefined);
      req.onerror = () => reject(req.error);
    });
  }

  async saveBook(book: Book): Promise<void> {
    const db = await openDB();
    const updated: Book = { ...book, updatedAt: new Date().toISOString() };
    return new Promise((resolve, reject) => {
      const tx = db.transaction(BOOKS_STORE, 'readwrite');
      tx.objectStore(BOOKS_STORE).put(updated);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async deleteBook(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(BOOKS_STORE, 'readwrite');
      tx.objectStore(BOOKS_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async importBooks(books: Book[]): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(BOOKS_STORE, 'readwrite');
      const store = tx.objectStore(BOOKS_STORE);
      for (const b of books) {
        if (b && b.id && b.title) {
          store.put(b);
        }
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const bookStorage: StorageAdapter = new IndexedDBStorage();

export function loadAIConfig(): AIProviderConfig {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AIProviderConfig>;
      return {
        provider: 'gemini',
        apiKey: parsed.apiKey || '',
        model: parsed.model || 'gemini-2.5-flash',
      };
    }
  } catch {
    // ignore parse errors
  }
  return {
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-2.5-flash',
  };
}

export function saveAIConfig(config: AIProviderConfig): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(config));
}

export function loadTheme(): ThemeMode {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  return 'light';
}

export function saveTheme(theme: ThemeMode): void {
  localStorage.setItem(THEME_KEY, theme);
}

export function loadUILang(): UILanguage {
  const saved = localStorage.getItem(LANG_KEY);
  if (saved === 'en' || saved === 'el') return saved;
  return 'el';
}

export function saveUILang(lang: UILanguage): void {
  localStorage.setItem(LANG_KEY, lang);
}

export function downloadTextFile(filename: string, content: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
