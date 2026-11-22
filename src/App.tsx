import React, { useEffect, useState } from 'react';
import { ActiveView, TopBar } from './components/Layout/TopBar';
import { BookLibrary } from './components/Library/BookLibrary';
import { NewBookWizard } from './components/Onboarding/NewBookWizard';
import { CompileView } from './components/Publish/CompileView';
import { ResearchHub } from './components/Research/ResearchHub';
import { SettingsModal } from './components/Settings/SettingsModal';
import { StudioWorkspace } from './components/Studio/StudioWorkspace';
import {
  bookStorage,
  downloadTextFile,
  loadAIConfig,
  loadTheme,
  loadUILang,
  saveAIConfig,
  saveTheme,
  saveUILang,
} from './services/storage';
import { AIProviderConfig, Book, ThemeMode, UILanguage } from './types/book';

export function App() {
  const [lang, setLang] = useState<UILanguage>(() => loadUILang());
  const [theme, setTheme] = useState<ThemeMode>(() => loadTheme());
  const [aiConfig, setAiConfig] = useState<AIProviderConfig>(() => loadAIConfig());

  const [books, setBooks] = useState<Book[]>([]);
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('library');
  const [showSettings, setShowSettings] = useState(false);

  const activeBook = books.find((b) => b.id === activeBookId) || null;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
    saveUILang(lang);
  }, [lang]);

  useEffect(() => {
    bookStorage.listBooks().then(setBooks).catch(console.error);
  }, []);

  const handleSaveBook = async (updated: Book) => {
    const withTimestamp = { ...updated, updatedAt: new Date().toISOString() };
    setBooks((prev) => {
      const exists = prev.some((b) => b.id === withTimestamp.id);
      if (exists) {
        return prev.map((b) => (b.id === withTimestamp.id ? withTimestamp : b));
      }
      return [withTimestamp, ...prev];
    });
    await bookStorage.saveBook(withTimestamp);
  };

  const handleCreateBook = async (newBook: Book) => {
    await handleSaveBook(newBook);
    setActiveBookId(newBook.id);
    setActiveView('studio');
  };

  const handleDeleteBook = async (id: string) => {
    await bookStorage.deleteBook(id);
    setBooks((prev) => prev.filter((b) => b.id !== id));
    if (activeBookId === id) {
      setActiveBookId(null);
      setActiveView('library');
    }
  };

  const handleExportBackup = () => {
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), books }, null, 2);
    downloadTextFile(
      `aibook-backup-${new Date().toISOString().slice(0, 10)}.json`,
      payload,
      'application/json'
    );
  };

  const handleImportBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        const imported: Book[] = Array.isArray(parsed) ? parsed : parsed.books || [];
        if (imported.length > 0) {
          await bookStorage.importBooks(imported);
          const refreshed = await bookStorage.listBooks();
          setBooks(refreshed);
        }
      } catch {
        window.alert(lang === 'el' ? 'Μη έγκυρο αρχείο backup JSON.' : 'Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar
        lang={lang}
        theme={theme}
        activeView={activeView}
        activeBook={activeBook}
        hasApiKey={Boolean(aiConfig.apiKey)}
        onSelectView={(v) => setActiveView(v)}
        onToggleTheme={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
        onToggleLang={() => setLang((prev) => (prev === 'el' ? 'en' : 'el'))}
        onOpenSettings={() => setShowSettings(true)}
      />

      {activeView === 'library' && (
        <BookLibrary
          lang={lang}
          books={books}
          hasApiKey={Boolean(aiConfig.apiKey)}
          onNewBook={() => setActiveView('onboarding')}
          onOpenBook={(book) => {
            setActiveBookId(book.id);
            setActiveView('studio');
          }}
          onDeleteBook={handleDeleteBook}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {activeView === 'onboarding' && (
        <NewBookWizard
          lang={lang}
          aiConfig={aiConfig}
          onCreateBook={handleCreateBook}
          onCancel={() => setActiveView('library')}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {activeView === 'studio' && activeBook && (
        <StudioWorkspace
          key={activeBook.id}
          lang={lang}
          book={activeBook}
          aiConfig={aiConfig}
          onUpdateBook={handleSaveBook}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {activeView === 'research' && activeBook && (
        <ResearchHub
          lang={lang}
          book={activeBook}
          aiConfig={aiConfig}
          onUpdateBook={handleSaveBook}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {activeView === 'compile' && activeBook && (
        <CompileView
          lang={lang}
          book={activeBook}
          aiConfig={aiConfig}
          onUpdateBook={handleSaveBook}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {showSettings && (
        <SettingsModal
          lang={lang}
          config={aiConfig}
          onSave={(cfg) => {
            setAiConfig(cfg);
            saveAIConfig(cfg);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default App;
