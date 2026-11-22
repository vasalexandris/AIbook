import React, { useState } from 'react';
import { Download, Loader2, Printer, Sparkles, Compass, TrendingUp, BookText } from 'lucide-react';
import { t } from '../../i18n/translations';
import { generateDistributionPlan } from '../../services/ai';
import { downloadTextFile } from '../../services/storage';
import { AIProviderConfig, Book, UILanguage } from '../../types/book';
import {
  compileBookToMarkdown,
  countBookWords,
  getFontClass,
  renderMarkdownHtml,
} from '../../utils/bookUtils';

interface CompileViewProps {
  lang: UILanguage;
  book: Book;
  aiConfig: AIProviderConfig;
  onUpdateBook: (book: Book) => void;
  onOpenSettings: () => void;
}

export const CompileView: React.FC<CompileViewProps> = ({
  lang,
  book,
  aiConfig,
  onUpdateBook,
  onOpenSettings,
}) => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedChapters = [...book.chapters].sort((a, b) => a.number - b.number);
  const totalWords = countBookWords(book);
  const fontClass = getFontClass(book.settings.fontFamily);

  const handleExportMd = () => {
    const md = compileBookToMarkdown(book);
    const safeName = book.title.replace(/[^a-zA-Z0-9\u0370-\u03FF_-]+/g, '_');
    downloadTextFile(`${safeName || 'book'}.md`, md, 'text/markdown;charset=utf-8');
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleGeneratePlan = async () => {
    if (!aiConfig.apiKey) {
      onOpenSettings();
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const plan = await generateDistributionPlan(aiConfig, book);
      onUpdateBook({ ...book, distributionPlan: plan });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating distribution plan');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      {/* Action Header (Hidden in Print) */}
      <div className="no-print mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-editorial text-2xl md:text-3xl font-semibold">
            {t(lang, 'compileTitle')}
          </h1>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
            {sortedChapters.length} {t(lang, 'chaptersCount')} • {totalWords.toLocaleString()}{' '}
            {t(lang, 'words')} • {book.genreLabel}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-export-md"
            onClick={handleExportMd}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold cursor-pointer"
            style={{
              borderColor: 'var(--border-strong)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
            }}
          >
            <Download className="h-3.5 w-3.5" />
            <span>{t(lang, 'exportMarkdown')}</span>
          </button>

          <button
            id="btn-print-pdf"
            onClick={handlePrintPdf}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white cursor-pointer"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <Printer className="h-3.5 w-3.5" />
            <span>{t(lang, 'printPdf')}</span>
          </button>

          <button
            id="btn-gen-distribution"
            onClick={handleGeneratePlan}
            disabled={generating}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-opacity disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: 'var(--sage)' }}
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            <span>
              {generating ? t(lang, 'generatingDistribution') : t(lang, 'generateDistribution')}
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div
          className="no-print mb-6 rounded-xl border p-3.5 text-xs"
          style={{
            backgroundColor: 'var(--danger-soft)',
            borderColor: 'var(--danger)',
            color: 'var(--danger)',
          }}
        >
          {error}
        </div>
      )}

      {/* AI Distribution & Evolution Plan (Hidden in Print) */}
      {book.distributionPlan && (
        <section
          className="no-print mb-10 rounded-2xl border p-6 space-y-5"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            boxShadow: 'var(--shadow-paper)',
          }}
        >
          <div className="flex items-center gap-2 font-editorial text-xl font-semibold">
            <Compass className="h-5 w-5" style={{ color: 'var(--sage)' }} />
            <span>{t(lang, 'generateDistribution')}</span>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-subtle)' }}>
              <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--accent)' }}>
                <BookText className="h-3.5 w-3.5" />
                {t(lang, 'blurbTitle')}
              </h3>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {book.distributionPlan.blurb}
              </p>
            </div>

            <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-subtle)' }}>
              <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--sage)' }}>
                <TrendingUp className="h-3.5 w-3.5" />
                {t(lang, 'positioningTitle')}
              </h3>
              <p className="text-sm leading-relaxed">{book.distributionPlan.positioning}</p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>
                {t(lang, 'channelsTitle')}
              </h3>
              <ul className="space-y-1.5 text-sm list-disc pl-5">
                {book.distributionPlan.channels.map((ch, i) => (
                  <li key={i}>{ch}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>
                {t(lang, 'evolutionTitle')}
              </h3>
              <ul className="space-y-1.5 text-sm list-disc pl-5">
                {book.distributionPlan.evolutionIdeas.map((idea, i) => (
                  <li key={i}>{idea}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Compiled Book Print/Preview Paper */}
      <article
        className={`print-book-page mx-auto max-w-3xl rounded-2xl border px-8 py-12 md:px-16 md:py-16 ${fontClass}`}
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          boxShadow: 'var(--shadow-paper)',
          fontSize: `${book.settings.fontSize}px`,
        }}
      >
        {/* Cover / Title Page */}
        <header className="text-center py-12 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="text-xs uppercase tracking-[0.2em] font-sans-book" style={{ color: 'var(--text-muted)' }}>
            {book.genreLabel}
          </div>
          <h1 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
            {book.title}
          </h1>
          {book.subtitle && (
            <p className="mt-3 text-xl italic" style={{ color: 'var(--text-secondary)' }}>
              {book.subtitle}
            </p>
          )}
          {book.authorName && (
            <p className="mt-8 text-base tracking-wide font-medium">{book.authorName}</p>
          )}
        </header>

        {/* Table of Contents */}
        <section className="py-10 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <h2 className="text-xl font-semibold mb-4">{t(lang, 'tableOfContents')}</h2>
          <ol className="space-y-2 text-base">
            {sortedChapters.map((ch) => (
              <li key={ch.id} className="flex items-baseline justify-between gap-2">
                <span>
                  <span style={{ color: 'var(--text-muted)' }}>{ch.number}. </span>
                  {ch.title}
                </span>
                <span className="text-xs font-sans-book" style={{ color: 'var(--text-muted)' }}>
                  {ch.status === 'completed' ? '✓' : '…'}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* Chapters */}
        {sortedChapters.map((ch) => (
          <section key={ch.id} className="print-chapter-break pt-12 pb-6">
            <div className="text-xs uppercase tracking-widest font-sans-book" style={{ color: 'var(--text-muted)' }}>
              {lang === 'el' ? `Κεφάλαιο ${ch.number}` : `Chapter ${ch.number}`}
            </div>
            <h2 className="mt-1 text-2xl md:text-3xl font-semibold mb-6">{ch.title}</h2>
            <div
              className="book-prose"
              dangerouslySetInnerHTML={{
                __html: renderMarkdownHtml(
                  ch.content.trim() ||
                    (lang === 'el' ? '*[Το κεφάλαιο δεν έχει γραφτεί ακόμα]*' : '*[Chapter draft pending]*')
                ),
              }}
            />
          </section>
        ))}

        {/* Bibliography */}
        {book.settings.includeBibliography && book.bible.researchItems.length > 0 && (
          <section className="print-chapter-break pt-12 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <h2 className="text-2xl font-semibold mb-4">
              {lang === 'el' ? 'Βιβλιογραφία & Πηγές' : 'Bibliography & References'}
            </h2>
            <ul className="space-y-2.5 text-sm leading-relaxed">
              {book.bible.researchItems.map((r) => (
                <li key={r.id}>
                  {r.authors.length ? `${r.authors.join(', ')} ` : ''}
                  {r.year ? `(${r.year}). ` : ''}
                  <em>{r.title}</em>.{' '}
                  {r.doi ? `https://doi.org/${r.doi}` : r.url || ''}
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </main>
  );
};
