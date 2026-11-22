import React, { useState } from 'react';
import {
  BookCopy,
  Check,
  Copy,
  ExternalLink,
  GraduationCap,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { t } from '../../i18n/translations';
import { analyzeResearchItems } from '../../services/ai';
import {
  formatAPACitation,
  ResearchSourceFilter,
  searchResearch,
  SearchResultItem,
} from '../../services/research';
import { AIProviderConfig, Book, ResearchItem, UILanguage } from '../../types/book';
import { renderMarkdownHtml, uid } from '../../utils/bookUtils';

interface ResearchHubProps {
  lang: UILanguage;
  book: Book;
  aiConfig: AIProviderConfig;
  onUpdateBook: (book: Book) => void;
  onOpenSettings: () => void;
}

export const ResearchHub: React.FC<ResearchHubProps> = ({
  lang,
  book,
  aiConfig,
  onUpdateBook,
  onOpenSettings,
}) => {
  const [query, setQuery] = useState(book.title);
  const [sourceFilter, setSourceFilter] = useState<ResearchSourceFilter>('all');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [saveCategory, setSaveCategory] = useState<ResearchItem['category']>('competitor');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // AI Research Synthesis
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const savedItems = book.bible.researchItems;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const items = await searchResearch(query, sourceFilter);
      setResults(items);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const isAlreadySaved = (title: string) =>
    savedItems.some((s) => s.title.toLowerCase() === title.toLowerCase());

  const handleSaveToBible = (item: SearchResultItem) => {
    if (isAlreadySaved(item.title)) return;
    const newItem: ResearchItem = {
      id: uid('res'),
      title: item.title,
      authors: item.authors,
      year: item.year,
      source: item.source,
      category: item.source === 'openlibrary' ? saveCategory : 'scientific',
      summary: item.summary,
      url: item.url,
      doi: item.doi,
      citationCount: item.citationCount,
      notes: '',
      addedAt: new Date().toISOString(),
    };
    onUpdateBook({
      ...book,
      bible: {
        ...book.bible,
        researchItems: [newItem, ...book.bible.researchItems],
      },
    });
  };

  const handleRemoveSaved = (id: string) => {
    onUpdateBook({
      ...book,
      bible: {
        ...book.bible,
        researchItems: book.bible.researchItems.filter((r) => r.id !== id),
      },
    });
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    onUpdateBook({
      ...book,
      bible: {
        ...book.bible,
        researchItems: book.bible.researchItems.map((r) =>
          r.id === id ? { ...r, notes } : r
        ),
      },
    });
  };

  const handleUpdateCategory = (id: string, category: ResearchItem['category']) => {
    onUpdateBook({
      ...book,
      bible: {
        ...book.bible,
        researchItems: book.bible.researchItems.map((r) =>
          r.id === id ? { ...r, category } : r
        ),
      },
    });
  };

  const handleCopyApa = (item: ResearchItem) => {
    navigator.clipboard.writeText(formatAPACitation(item));
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleAnalyzeWithAI = async () => {
    if (!aiConfig.apiKey) {
      onOpenSettings();
      return;
    }
    if (savedItems.length === 0) return;
    setAnalyzing(true);
    setAiError(null);
    try {
      const report = await analyzeResearchItems(aiConfig, book, savedItems);
      setAiAnalysis(report);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI analysis error');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-7 md:px-8">
      <div className="mb-6">
        <h1 className="font-editorial text-2xl md:text-3xl font-semibold">
          {t(lang, 'researchTitle')}
        </h1>
        <p className="mt-1.5 max-w-3xl text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {t(lang, 'researchSubtitle')}
        </p>
      </div>

      {/* Search Bar */}
      <form
        onSubmit={handleSearch}
        className="rounded-2xl border p-4 md:p-5"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          boxShadow: 'var(--shadow-paper)',
        }}
      >
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              id="input-research-query"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t(lang, 'searchPlaceholder')}
              className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as ResearchSourceFilter)}
            className="rounded-xl border px-3.5 py-2.5 text-xs font-medium outline-none"
            style={{
              backgroundColor: 'var(--bg-canvas)',
              borderColor: 'var(--border-strong)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="all">{t(lang, 'sourceAll')}</option>
            <option value="openlibrary">{t(lang, 'sourceBooks')}</option>
            <option value="crossref">{t(lang, 'sourceScientific')}</option>
            <option value="openalex">{t(lang, 'sourceAcademic')}</option>
          </select>

          <button
            id="btn-run-research"
            type="submit"
            disabled={searching || !query.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white transition-opacity disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span>{searching ? t(lang, 'searching') : t(lang, 'searchBtn')}</span>
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>{lang === 'el' ? 'Προεπιλεγμένη ετικέτα αποθήκευσης:' : 'Default save tag:'}</span>
          {(['competitor', 'scientific', 'inspiration', 'reference'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSaveCategory(cat)}
              className="rounded-full px-2.5 py-0.5 text-[11px] font-medium cursor-pointer"
              style={{
                backgroundColor: saveCategory === cat ? 'var(--accent-soft)' : 'var(--bg-subtle)',
                color: saveCategory === cat ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              {cat === 'competitor'
                ? t(lang, 'catCompetitor')
                : cat === 'scientific'
                ? t(lang, 'catScientific')
                : cat === 'inspiration'
                ? t(lang, 'catInspiration')
                : t(lang, 'catReference')}
            </button>
          ))}
        </div>
      </form>

      {searchError && (
        <div
          className="mt-4 rounded-xl border p-3 text-xs"
          style={{
            backgroundColor: 'var(--danger-soft)',
            borderColor: 'var(--danger)',
            color: 'var(--danger)',
          }}
        >
          {searchError}
        </div>
      )}

      {/* Two-Column Layout: Search Results + Saved Bibliography */}
      <div className="mt-7 grid gap-6 lg:grid-cols-12">
        {/* Search Results */}
        <section className="lg:col-span-7 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            {lang === 'el' ? `Αποτελέσματα Αναζήτησης (${results.length})` : `Search Results (${results.length})`}
          </h2>

          {results.length === 0 ? (
            <div
              className="rounded-2xl border p-8 text-center text-sm"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
            >
              {lang === 'el'
                ? 'Κάνε αναζήτηση για να εντοπίσεις ανταγωνιστικά βιβλία, επιστημονικά άρθρα ή σχετική βιβλιογραφία.'
                : 'Search above to discover competing books, scientific papers, or related literature.'}
            </div>
          ) : (
            results.map((item) => {
              const saved = isAlreadySaved(item.title);
              return (
                <article
                  key={item.id}
                  className="rounded-xl border p-4 transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
                          style={{
                            backgroundColor:
                              item.source === 'openlibrary' ? 'var(--amber-soft)' : 'var(--sage-soft)',
                            color: item.source === 'openlibrary' ? 'var(--amber)' : 'var(--sage)',
                          }}
                        >
                          {item.source === 'openlibrary' ? (
                            <BookCopy className="h-3 w-3" />
                          ) : (
                            <GraduationCap className="h-3 w-3" />
                          )}
                          {item.source}
                        </span>
                        {item.year && (
                          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            {item.year}
                          </span>
                        )}
                        {typeof item.citationCount === 'number' && (
                          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            • {item.citationCount.toLocaleString()} citations
                          </span>
                        )}
                      </div>

                      <h3 className="font-editorial text-base font-semibold leading-snug">
                        {item.title}
                      </h3>
                      {item.authors.length > 0 && (
                        <p className="mt-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {item.authors.join(', ')}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleSaveToBible(item)}
                      disabled={saved}
                      className="shrink-0 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity disabled:opacity-60 cursor-pointer"
                      style={{
                        backgroundColor: saved ? 'var(--sage-soft)' : 'var(--accent)',
                        color: saved ? 'var(--sage)' : '#ffffff',
                      }}
                    >
                      {saved ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                      <span>{saved ? t(lang, 'savedInBible') : t(lang, 'saveToBible')}</span>
                    </button>
                  </div>

                  {item.summary && (
                    <p
                      className="mt-2 text-xs leading-relaxed line-clamp-3"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {item.summary}
                    </p>
                  )}

                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium underline"
                      style={{ color: 'var(--accent)' }}
                    >
                      {item.doi ? `DOI: ${item.doi}` : 'Open source'}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </article>
              );
            })
          )}
        </section>

        {/* Saved Bibliography & AI Analysis */}
        <section className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              {t(lang, 'savedBibliographyTitle')} ({savedItems.length})
            </h2>
            {savedItems.length > 0 && (
              <button
                id="btn-analyze-research"
                onClick={handleAnalyzeWithAI}
                disabled={analyzing}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: 'var(--sage)' }}
              >
                {analyzing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span>{analyzing ? t(lang, 'analyzingResearch') : t(lang, 'analyzeResearchBtn')}</span>
              </button>
            )}
          </div>

          {aiError && (
            <div
              className="rounded-xl border p-3 text-xs"
              style={{
                backgroundColor: 'var(--danger-soft)',
                borderColor: 'var(--danger)',
                color: 'var(--danger)',
              }}
            >
              {aiError}
            </div>
          )}

          {aiAnalysis && (
            <div
              className="rounded-2xl border p-4"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--sage)',
              }}
            >
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--sage)' }}>
                <Sparkles className="h-3.5 w-3.5" />
                <span>{lang === 'el' ? 'AI Ανάλυση Ανταγωνισμού & Πηγών' : 'AI Competitive & Literature Synthesis'}</span>
              </div>
              <div
                className="book-prose text-xs"
                dangerouslySetInnerHTML={{ __html: renderMarkdownHtml(aiAnalysis) }}
              />
            </div>
          )}

          {savedItems.length === 0 ? (
            <div
              className="rounded-2xl border p-6 text-center text-xs"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
            >
              {lang === 'el'
                ? 'Δεν έχεις αποθηκεύσει ακόμα πηγές ή ανταγωνιστικά έργα. Ό,τι αποθηκεύεις εδώ μπαίνει αυτόματα στο Book Bible.'
                : 'No saved sources yet. Everything saved here is automatically injected into your Book Bible.'}
            </div>
          ) : (
            <div className="space-y-3">
              {savedItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border p-3.5"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold leading-snug">{item.title}</h3>
                      <p className="mt-0.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {item.authors.join(', ')} {item.year ? `(${item.year})` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveSaved(item.id)}
                      className="p-1 opacity-60 hover:opacity-100 cursor-pointer"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <select
                      value={item.category}
                      onChange={(e) =>
                        handleUpdateCategory(item.id, e.target.value as ResearchItem['category'])
                      }
                      className="rounded-md border px-2 py-1 text-[11px] outline-none"
                      style={{
                        backgroundColor: 'var(--bg-canvas)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <option value="competitor">{t(lang, 'catCompetitor')}</option>
                      <option value="scientific">{t(lang, 'catScientific')}</option>
                      <option value="inspiration">{t(lang, 'catInspiration')}</option>
                      <option value="reference">{t(lang, 'catReference')}</option>
                    </select>

                    <button
                      onClick={() => handleCopyApa(item)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                      style={{ color: 'var(--accent)' }}
                    >
                      {copiedId === item.id ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      <span>{copiedId === item.id ? t(lang, 'copied') : t(lang, 'copyApa')}</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    value={item.notes || ''}
                    onChange={(e) => handleUpdateNotes(item.id, e.target.value)}
                    placeholder={lang === 'el' ? 'Σημείωση (π.χ. σε τι διαφέρουμε / πού θα αναφερθεί)...' : 'Note (e.g. how we differ / where to cite)...'}
                    className="mt-2 w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                    style={{
                      backgroundColor: 'var(--bg-canvas)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};
