import React from 'react';
import {
  BookOpen,
  Feather,
  Globe,
  KeyRound,
  Library,
  Moon,
  Search,
  Sparkles,
  Sun,
} from 'lucide-react';
import { t } from '../../i18n/translations';
import { Book, ThemeMode, UILanguage } from '../../types/book';

export type ActiveView = 'library' | 'onboarding' | 'studio' | 'research' | 'compile';

interface TopBarProps {
  lang: UILanguage;
  theme: ThemeMode;
  activeView: ActiveView;
  activeBook: Book | null;
  hasApiKey: boolean;
  onSelectView: (view: ActiveView) => void;
  onToggleTheme: () => void;
  onToggleLang: () => void;
  onOpenSettings: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  lang,
  theme,
  activeView,
  activeBook,
  hasApiKey,
  onSelectView,
  onToggleTheme,
  onToggleLang,
  onOpenSettings,
}) => {
  return (
    <header
      className="no-print sticky top-0 z-30 flex items-center justify-between gap-3 border-b px-4 py-2.5 md:px-6"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Brand + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          id="nav-brand-btn"
          onClick={() => onSelectView('library')}
          className="flex items-center gap-2.5 text-left group cursor-pointer"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-transform group-hover:scale-105"
            style={{
              backgroundColor: 'var(--accent)',
              color: '#ffffff',
            }}
          >
            <Feather className="h-4 w-4" />
          </span>
          <div className="leading-tight">
            <div className="font-editorial text-lg font-semibold tracking-tight">
              {t(lang, 'appName')}
            </div>
            <div
              className="hidden sm:block text-[11px]"
              style={{ color: 'var(--text-muted)' }}
            >
              {t(lang, 'appTagline')}
            </div>
          </div>
        </button>

        {activeBook && activeView !== 'library' && activeView !== 'onboarding' && (
          <div
            className="hidden lg:flex items-center gap-2 pl-3 ml-1 border-l min-w-0"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <span
              className="truncate max-w-[220px] font-editorial text-sm font-medium"
              title={activeBook.title}
            >
              {activeBook.title}
            </span>
            <span
              className="text-[11px] px-2 py-0.5 rounded-full whitespace-nowrap"
              style={{
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              {activeBook.genreLabel}
            </span>
          </div>
        )}
      </div>

      {/* Book Navigation Tabs */}
      {activeBook && activeView !== 'library' && activeView !== 'onboarding' && (
        <nav
          aria-label="Book workspace navigation"
          className="flex items-center gap-1 rounded-lg p-1"
          style={{ backgroundColor: 'var(--bg-subtle)' }}
        >
          <button
            id="tab-studio"
            onClick={() => onSelectView('studio')}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
            style={{
              backgroundColor: activeView === 'studio' ? 'var(--bg-surface)' : 'transparent',
              color: activeView === 'studio' ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: activeView === 'studio' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>{t(lang, 'studio')}</span>
          </button>

          <button
            id="tab-research"
            onClick={() => onSelectView('research')}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
            style={{
              backgroundColor: activeView === 'research' ? 'var(--bg-surface)' : 'transparent',
              color: activeView === 'research' ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: activeView === 'research' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t(lang, 'research')}</span>
            {activeBook.bible.researchItems.length > 0 && (
              <span
                className="ml-0.5 rounded-full px-1.5 text-[10px]"
                style={{
                  backgroundColor: 'var(--accent-soft)',
                  color: 'var(--accent)',
                }}
              >
                {activeBook.bible.researchItems.length}
              </span>
            )}
          </button>

          <button
            id="tab-compile"
            onClick={() => onSelectView('compile')}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
            style={{
              backgroundColor: activeView === 'compile' ? 'var(--bg-surface)' : 'transparent',
              color: activeView === 'compile' ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: activeView === 'compile' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t(lang, 'compile')}</span>
          </button>
        </nav>
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-1.5">
        {activeView !== 'library' && (
          <button
            id="btn-back-library"
            onClick={() => onSelectView('library')}
            className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer"
            style={{
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <Library className="h-3.5 w-3.5" />
            <span className="hidden md:inline">{t(lang, 'backToLibrary')}</span>
          </button>
        )}

        <button
          id="btn-toggle-lang"
          onClick={onToggleLang}
          title="Switch language (EL / EN)"
          className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer"
          style={{
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <Globe className="h-3.5 w-3.5" />
          <span>{lang.toUpperCase()}</span>
        </button>

        <button
          id="btn-toggle-theme"
          onClick={onToggleTheme}
          title="Toggle Light / Dark mode"
          className="flex items-center justify-center rounded-lg border p-1.5 transition-colors cursor-pointer"
          style={{
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        <button
          id="btn-open-settings"
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer"
          style={{
            borderColor: hasApiKey ? 'var(--border-subtle)' : 'var(--accent)',
            backgroundColor: hasApiKey ? 'var(--bg-surface)' : 'var(--accent-soft)',
            color: hasApiKey ? 'var(--text-primary)' : 'var(--accent)',
          }}
        >
          <KeyRound className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t(lang, 'settings')}</span>
        </button>
      </div>
    </header>
  );
};
