import React, { useRef } from 'react';
import {
  BookOpen,
  Download,
  KeyRound,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { t } from '../../i18n/translations';
import { Book, UILanguage } from '../../types/book';
import { countBookWords } from '../../utils/bookUtils';

interface BookLibraryProps {
  lang: UILanguage;
  books: Book[];
  hasApiKey: boolean;
  onNewBook: () => void;
  onOpenBook: (book: Book) => void;
  onDeleteBook: (id: string) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onOpenSettings: () => void;
}

export const BookLibrary: React.FC<BookLibraryProps> = ({
  lang,
  books,
  hasApiKey,
  onNewBook,
  onOpenBook,
  onDeleteBook,
  onExportBackup,
  onImportBackup,
  onOpenSettings,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
      {/* Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-editorial text-3xl md:text-4xl font-semibold tracking-tight">
            {t(lang, 'library')}
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {lang === 'el'
              ? 'Το προσωπικό σου στούντιο συγγραφής, έρευνας και επιμέλειας βιβλίων με ΑΙ.'
              : 'Your personal studio for AI-assisted book authoring, research, and editorial craft.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImportBackup(f);
              e.target.value = '';
            }}
          />
          <button
            id="btn-import-backup"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors cursor-pointer"
            style={{
              borderColor: 'var(--border-strong)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
            }}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>{t(lang, 'importBackup')}</span>
          </button>

          {books.length > 0 && (
            <button
              id="btn-export-backup"
              onClick={onExportBackup}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors cursor-pointer"
              style={{
                borderColor: 'var(--border-strong)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
              }}
            >
              <Download className="h-3.5 w-3.5" />
              <span>{t(lang, 'exportBackup')}</span>
            </button>
          )}

          <button
            id="btn-new-book"
            onClick={onNewBook}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <Plus className="h-4 w-4" />
            <span>{t(lang, 'newBook')}</span>
          </button>
        </div>
      </div>

      {/* Gentle API Key Notice */}
      {!hasApiKey && (
        <div
          className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border px-4 py-3.5"
          style={{
            backgroundColor: 'var(--amber-soft)',
            borderColor: 'var(--border-strong)',
          }}
        >
          <div className="flex items-start gap-2.5 text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            <KeyRound className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--amber)' }} />
            <span>{t(lang, 'apiKeyMissingBanner')}</span>
          </div>
          <button
            onClick={onOpenSettings}
            className="shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white cursor-pointer"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {t(lang, 'configureApiKey')}
          </button>
        </div>
      )}

      {/* Empty State or Bookshelf Grid */}
      {books.length === 0 ? (
        <section
          className="mt-10 rounded-2xl border p-10 text-center"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            boxShadow: 'var(--shadow-paper)',
          }}
        >
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            <BookOpen className="h-7 w-7" />
          </div>
          <h2 className="mt-5 font-editorial text-2xl font-semibold">
            {t(lang, 'noBooksTitle')}
          </h2>
          <p
            className="mx-auto mt-2 max-w-xl text-sm leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t(lang, 'noBooksDesc')}
          </p>
          <button
            id="btn-create-first-book"
            onClick={onNewBook}
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <Plus className="h-4 w-4" />
            <span>{t(lang, 'createFirstBook')}</span>
          </button>
        </section>
      ) : (
        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => {
            const totalWords = countBookWords(book);
            const completed = book.chapters.filter((c) => c.status === 'completed').length;
            const progress =
              book.chapters.length > 0 ? Math.round((completed / book.chapters.length) * 100) : 0;

            return (
              <article
                key={book.id}
                className="group flex flex-col justify-between rounded-2xl border p-5 transition-all hover:-translate-y-0.5"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  boxShadow: 'var(--shadow-paper)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                      style={{
                        backgroundColor: 'var(--bg-subtle)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {book.genreLabel}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {book.settings.language}
                    </span>
                  </div>

                  <h2
                    onClick={() => onOpenBook(book)}
                    className="mt-3 font-editorial text-xl font-semibold leading-snug cursor-pointer group-hover:underline"
                  >
                    {book.title}
                  </h2>
                  {book.subtitle && (
                    <p className="mt-0.5 text-xs italic" style={{ color: 'var(--text-muted)' }}>
                      {book.subtitle}
                    </p>
                  )}

                  <p
                    className="mt-3 line-clamp-3 text-xs leading-relaxed"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {book.bible.premise || book.bible.purpose}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  {/* Progress bar */}
                  <div className="flex items-center justify-between text-[11px] mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" style={{ color: 'var(--sage)' }} />
                      {completed}/{book.chapters.length} {t(lang, 'completedCount')}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {totalWords.toLocaleString()} {t(lang, 'words')}
                    </span>
                  </div>
                  <div
                    className="h-1.5 w-full overflow-hidden rounded-full"
                    style={{ backgroundColor: 'var(--bg-subtle)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: 'var(--sage)',
                      }}
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onOpenBook(book)}
                      className="flex-1 rounded-lg px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      {t(lang, 'openStudio')}
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(t(lang, 'confirmDeleteBook'))) {
                          onDeleteBook(book.id);
                        }
                      }}
                      title={t(lang, 'deleteBook')}
                      className="rounded-lg border p-2 transition-colors hover:opacity-80 cursor-pointer"
                      style={{
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
};
