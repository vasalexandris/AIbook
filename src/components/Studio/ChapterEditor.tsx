import React, { useMemo, useRef, useState } from 'react';
import {
  Bold,
  CheckCircle2,
  Download,
  Edit3,
  Eye,
  GitCompare,
  Heading2,
  History,
  ImagePlus,
  Italic,
  ListChecks,
  Loader2,
  PanelLeft,
  Quote,
  RotateCcw,
  Save,
  Sparkles,
  SplitSquareHorizontal,
  Table,
  Type,
  X,
} from 'lucide-react';
import { t } from '../../i18n/translations';
import { generateBookImage } from '../../services/ai';
import { downloadTextFile } from '../../services/storage';
import {
  AIProviderConfig,
  Book,
  BookFontFamily,
  Chapter,
  ChapterRevision,
  UILanguage,
} from '../../types/book';
import {
  BOOK_FONT_OPTIONS,
  countWords,
  getFontClass,
  renderMarkdownHtml,
} from '../../utils/bookUtils';

interface ChapterEditorProps {
  lang: UILanguage;
  book: Book;
  chapter: Chapter;
  aiConfig: AIProviderConfig;
  completing: boolean;
  checkingRipple: boolean;
  sidebarOpen: boolean;
  selectedExcerpt: string;
  onToggleSidebar: () => void;
  onSelectExcerpt: (excerpt: string) => void;
  onUpdateChapter: (updated: Chapter) => void;
  onSaveSnapshot: (label: string) => void;
  onRestoreRevision: (rev: ChapterRevision, mode: 'excerpt' | 'full') => void;
  onUpdateFont: (font: BookFontFamily, size: number) => void;
  onCompleteChapter: () => void;
  onCheckRipple: () => void;
  onOpenSettings: () => void;
}

export const ChapterEditor: React.FC<ChapterEditorProps> = ({
  lang,
  book,
  chapter,
  aiConfig,
  completing,
  checkingRipple,
  sidebarOpen,
  selectedExcerpt,
  onToggleSidebar,
  onSelectExcerpt,
  onUpdateChapter,
  onSaveSnapshot,
  onRestoreRevision,
  onUpdateFont,
  onCompleteChapter,
  onCheckRipple,
  onOpenSettings,
}) => {
  const [viewMode, setViewMode] = useState<'write' | 'split' | 'preview' | 'paragraphs'>('write');
  const [selectedParagraphIndexes, setSelectedParagraphIndexes] = useState<number[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const [showImagePrompt, setShowImagePrompt] = useState(false);
  const [imgPrompt, setImgPrompt] = useState('');
  const [generatingImg, setGeneratingImg] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fontClass = getFontClass(book.settings.fontFamily);
  const wc = countWords(chapter.content);
  const revisions = chapter.revisions || [];

  const paragraphs = useMemo(() => {
    return chapter.content
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
  }, [chapter.content]);

  const toggleParagraphSelection = (idx: number) => {
    setSelectedParagraphIndexes((prev) => {
      const next = prev.includes(idx)
        ? prev.filter((i) => i !== idx)
        : [...prev, idx].sort((a, b) => a - b);
      const combined = next.map((i) => paragraphs[i]).filter(Boolean).join('\n\n');
      onSelectExcerpt(combined);
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedParagraphIndexes([]);
    onSelectExcerpt('');
  };

  const handleTextareaSelect = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (end > start) {
      const highlighted = chapter.content.slice(start, end).trim();
      if (highlighted.length >= 6) {
        onSelectExcerpt(highlighted);
      }
    }
  };

  const insertSnippet = (before: string, after = '', placeholder = '') => {
    const el = textareaRef.current;
    if (!el) {
      onUpdateChapter({
        ...chapter,
        content: `${chapter.content}\n${before}${placeholder}${after}`,
        status: chapter.status === 'planned' ? 'draft' : chapter.status,
      });
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = chapter.content.slice(start, end) || placeholder;
    const next =
      chapter.content.slice(0, start) + before + selected + after + chapter.content.slice(end);
    onUpdateChapter({
      ...chapter,
      content: next,
      status: chapter.status === 'planned' ? 'draft' : chapter.status,
    });
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  const handleInsertTable = () => {
    const tableMd =
      lang === 'el'
        ? `\n| Στήλη 1 | Στήλη 2 | Στήλη 3 |\n| :--- | :--- | :--- |\n| Τιμή Α | Τιμή Β | Τιμή Γ |\n| Τιμή Δ | Τιμή Ε | Τιμή Ζ |\n`
        : `\n| Column 1 | Column 2 | Column 3 |\n| :--- | :--- | :--- |\n| Value A | Value B | Value C |\n| Value D | Value E | Value F |\n`;
    insertSnippet(tableMd);
  };

  const handleUploadImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (dataUrl) {
        insertSnippet(`\n![${file.name.replace(/\.[^.]+$/, '')}](${dataUrl})\n`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateImage = async () => {
    if (!aiConfig.apiKey) {
      onOpenSettings();
      return;
    }
    if (!imgPrompt.trim()) return;
    setGeneratingImg(true);
    setImgError(null);
    try {
      const dataUrl = await generateBookImage(aiConfig, imgPrompt.trim());
      insertSnippet(`\n![${imgPrompt.trim().slice(0, 60)}](${dataUrl})\n`);
      setImgPrompt('');
      setShowImagePrompt(false);
    } catch (err) {
      setImgError(err instanceof Error ? err.message : 'Image generation failed');
    } finally {
      setGeneratingImg(false);
    }
  };

  const handleDownloadChapter = () => {
    const md = `# ${chapter.number}. ${chapter.title}\n\n${chapter.content}`;
    downloadTextFile(`chapter_${chapter.number}.md`, md, 'text/markdown;charset=utf-8');
  };

  return (
    <section
      className="relative flex h-full flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--bg-canvas)' }}
    >
      {/* Chapter Header + Actions */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            id="btn-toggle-sidebar"
            onClick={onToggleSidebar}
            title={lang === 'el' ? 'Κεφάλαια & Βίβλος' : 'Chapters & Book Bible'}
            className="hidden lg:inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer"
            style={{
              borderColor: sidebarOpen ? 'var(--accent)' : 'var(--border-strong)',
              backgroundColor: sidebarOpen ? 'var(--accent-soft)' : 'var(--bg-canvas)',
              color: sidebarOpen ? 'var(--accent)' : 'var(--text-primary)',
            }}
          >
            <PanelLeft className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">
              {lang === 'el' ? 'Κεφάλαια' : 'Chapters'}
            </span>
          </button>

          <span
            className="shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold"
            style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}
          >
            {lang === 'el' ? `Κεφ. ${chapter.number}` : `Ch. ${chapter.number}`}
          </span>
          <input
            type="text"
            value={chapter.title}
            onChange={(e) => onUpdateChapter({ ...chapter, title: e.target.value })}
            className="min-w-0 flex-1 bg-transparent font-editorial text-base font-semibold outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            id="btn-revision-history"
            onClick={() => setShowHistory((v) => !v)}
            title={lang === 'el' ? 'Ιστορικό αλλαγών & επαναφορά' : 'Revision history & restore'}
            className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-medium cursor-pointer"
            style={{
              borderColor: showHistory ? 'var(--accent)' : 'var(--border-subtle)',
              backgroundColor: showHistory ? 'var(--accent-soft)' : 'var(--bg-canvas)',
              color: showHistory ? 'var(--accent)' : 'var(--text-secondary)',
            }}
          >
            <History className="h-3.5 w-3.5" />
            <span>{revisions.length}</span>
          </button>

          <button
            onClick={handleDownloadChapter}
            title={t(lang, 'saveChapterLocal')}
            className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-medium cursor-pointer"
            style={{
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-canvas)',
            }}
          >
            <Download className="h-3.5 w-3.5" />
          </button>

          <button
            id="btn-check-ripple"
            onClick={onCheckRipple}
            disabled={checkingRipple}
            title={t(lang, 'checkRippleBtn')}
            className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-opacity disabled:opacity-50 cursor-pointer"
            style={{
              borderColor: 'var(--amber)',
              backgroundColor: 'var(--amber-soft)',
              color: 'var(--amber)',
            }}
          >
            {checkingRipple ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <GitCompare className="h-3.5 w-3.5" />
            )}
            <span className="hidden 2xl:inline">
              {checkingRipple ? t(lang, 'checkingRipple') : t(lang, 'checkRippleBtn')}
            </span>
          </button>

          <button
            id="btn-complete-chapter"
            onClick={onCompleteChapter}
            disabled={completing || !chapter.content.trim()}
            title={t(lang, 'completeChapterBtn')}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-white transition-opacity disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: 'var(--sage)' }}
          >
            {completing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            <span className="hidden xl:inline">
              {lang === 'el' ? 'Ολοκλήρωση' : 'Complete'}
            </span>
          </button>
        </div>
      </div>

      {/* Formatting & View Toolbar */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-1.5 text-xs"
        style={{
          backgroundColor: 'var(--bg-subtle)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex flex-wrap items-center gap-0.5">
          <button
            type="button"
            onClick={() => insertSnippet('## ', '', 'Heading')}
            title="Heading"
            className="rounded p-1.5 hover:opacity-80 cursor-pointer"
          >
            <Heading2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('**', '**', 'bold')}
            title="Bold"
            className="rounded p-1.5 hover:opacity-80 cursor-pointer"
          >
            <Bold className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('*', '*', 'italic')}
            title="Italic"
            className="rounded p-1.5 hover:opacity-80 cursor-pointer"
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('\n> ', '', 'Quote')}
            title="Blockquote"
            className="rounded p-1.5 hover:opacity-80 cursor-pointer"
          >
            <Quote className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleInsertTable}
            title={t(lang, 'insertTable')}
            className="rounded p-1.5 hover:opacity-80 cursor-pointer"
          >
            <Table className="h-3.5 w-3.5" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUploadImage(f);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title={t(lang, 'uploadImage')}
            className="rounded p-1.5 hover:opacity-80 cursor-pointer"
          >
            <ImagePlus className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setShowImagePrompt((v) => !v)}
            title={t(lang, 'aiImage')}
            className="rounded p-1.5 hover:opacity-80 cursor-pointer"
            style={{ color: 'var(--accent)' }}
          >
            <Sparkles className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Font + View Mode (including Paragraph Selection mode!) */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="hidden xl:flex items-center gap-1">
            <Type className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
            <select
              value={book.settings.fontFamily}
              onChange={(e) => onUpdateFont(e.target.value as BookFontFamily, book.settings.fontSize)}
              className="rounded border px-1.5 py-0.5 text-[11px] outline-none"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              {BOOK_FONT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label.split(' ')[0]}
                </option>
              ))}
            </select>
            <select
              value={book.settings.fontSize}
              onChange={(e) => onUpdateFont(book.settings.fontFamily, Number(e.target.value))}
              className="rounded border px-1 py-0.5 text-[11px] outline-none"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              {[15, 16, 17, 18, 20, 22].map((sz) => (
                <option key={sz} value={sz}>
                  {sz}px
                </option>
              ))}
            </select>
          </div>

          <div
            className="flex rounded-lg border p-0.5"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            {(
              [
                { id: 'write', icon: Edit3, label: t(lang, 'writeMode') },
                {
                  id: 'paragraphs',
                  icon: ListChecks,
                  label: lang === 'el' ? 'Παράγραφοι' : 'Paragraphs',
                },
                { id: 'split', icon: SplitSquareHorizontal, label: t(lang, 'splitMode') },
                { id: 'preview', icon: Eye, label: t(lang, 'previewMode') },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => setViewMode(m.id)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium cursor-pointer"
                style={{
                  backgroundColor: viewMode === m.id ? 'var(--accent-soft)' : 'transparent',
                  color: viewMode === m.id ? 'var(--accent)' : 'var(--text-muted)',
                }}
              >
                <m.icon className="h-3 w-3" />
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Selection Banner */}
      {selectedExcerpt && (
        <div
          className="flex items-center justify-between gap-2 border-b px-3.5 py-1.5 text-xs"
          style={{
            backgroundColor: 'var(--accent-soft)',
            borderColor: 'var(--border-strong)',
            color: 'var(--accent)',
          }}
        >
          <span className="truncate font-medium">
            {lang === 'el'
              ? `Εστίαση ΑΙ σε επιλεγμένο κείμενο (${countWords(selectedExcerpt)} λέξεις): «${selectedExcerpt.slice(
                  0,
                  55
                )}${selectedExcerpt.length > 55 ? '...' : ''}»`
              : `AI focused on selected passage (${countWords(selectedExcerpt)} words): "${selectedExcerpt.slice(
                  0,
                  55
                )}${selectedExcerpt.length > 55 ? '...' : ''}"`}
          </span>
          <button
            onClick={handleClearSelection}
            className="shrink-0 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold cursor-pointer"
            style={{
              borderColor: 'var(--accent)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--accent)',
            }}
          >
            <X className="h-3 w-3" />
            <span>{lang === 'el' ? 'Όλο το κεφάλαιο' : 'Whole chapter'}</span>
          </button>
        </div>
      )}

      {/* Optional Revision History Panel */}
      {showHistory && (
        <div
          className="max-h-64 overflow-y-auto border-b px-4 py-3 space-y-2.5"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-strong)',
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold">
              {lang === 'el'
                ? 'Ιστορικό Αλλαγών & Επιλεκτική Επαναφορά'
                : 'Revision History & Selective Restore'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  onSaveSnapshot(
                    lang === 'el' ? 'Χειροκίνητο στιγμιότυπο' : 'Manual snapshot'
                  )
                }
                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold text-white cursor-pointer"
                style={{ backgroundColor: 'var(--sage)' }}
              >
                <Save className="h-3 w-3" />
                <span>{lang === 'el' ? 'Αποθήκευση Στιγμιότυπου' : 'Save Snapshot'}</span>
              </button>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {revisions.length === 0 ? (
            <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
              {lang === 'el'
                ? 'Κάθε φορά που εφαρμόζεις μια πρόταση της ΑΙ, αποθηκεύεται αυτόματα η προηγούμενη εκδοχή εδώ για να μπορείς να επαναφέρεις ακόμα και μία μόνο παράγραφο.'
                : 'Every time you apply an AI suggestion, the previous version is automatically saved here so you can selectively restore even a single paragraph.'}
            </p>
          ) : (
            <div className="space-y-2">
              {revisions.map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-xl border p-2.5 text-xs"
                  style={{
                    backgroundColor: 'var(--bg-canvas)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold">{rev.label}</span>
                      <span className="ml-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {new Date(rev.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {rev.previousExcerpt && rev.newExcerpt && (
                        <button
                          onClick={() => onRestoreRevision(rev, 'excerpt')}
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold cursor-pointer"
                          style={{
                            borderColor: 'var(--sage)',
                            backgroundColor: 'var(--sage-soft)',
                            color: 'var(--sage)',
                          }}
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>
                            {lang === 'el'
                              ? 'Επαναφορά μόνο αυτής της παραγράφου'
                              : 'Restore only this excerpt'}
                          </span>
                        </button>
                      )}
                      <button
                        onClick={() => onRestoreRevision(rev, 'full')}
                        className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium cursor-pointer"
                        style={{
                          borderColor: 'var(--border-strong)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>{lang === 'el' ? 'Όλο το κεφάλαιο' : 'Full chapter'}</span>
                      </button>
                    </div>
                  </div>
                  {rev.previousExcerpt && (
                    <p
                      className="mt-1.5 line-clamp-2 text-[11px] italic"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      «{rev.previousExcerpt}»
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Optional AI Image Prompt Bar */}
      {showImagePrompt && (
        <div
          className="border-b px-4 py-2.5 flex flex-col gap-2"
          style={{
            backgroundColor: 'var(--accent-soft)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={imgPrompt}
              onChange={(e) => setImgPrompt(e.target.value)}
              placeholder={
                lang === 'el'
                  ? 'Περίγραψε την εικόνα που θέλεις...'
                  : 'Describe the illustration...'
              }
              className="flex-1 rounded-lg border px-3 py-1.5 text-xs outline-none"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-strong)',
              }}
            />
            <button
              onClick={handleGenerateImage}
              disabled={generatingImg || !imgPrompt.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {generatingImg ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              <span>{lang === 'el' ? 'Παραγωγή' : 'Generate'}</span>
            </button>
          </div>
          {imgError && (
            <div className="text-[11px]" style={{ color: 'var(--danger)' }}>
              {imgError}
            </div>
          )}
        </div>
      )}

      {/* Chapter Outline Bar */}
      <div
        className="border-b px-4 py-1.5"
        style={{
          backgroundColor: 'var(--bg-canvas)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <input
          type="text"
          value={chapter.outline}
          onChange={(e) => onUpdateChapter({ ...chapter, outline: e.target.value })}
          placeholder={`${t(lang, 'chapterOutlineLabel')}...`}
          className="w-full bg-transparent text-xs italic outline-none"
          style={{ color: 'var(--text-secondary)' }}
        />
      </div>

      {/* Main Editor / Paragraph Selector / Preview Area */}
      <div className="flex-1 overflow-hidden flex">
        {viewMode === 'paragraphs' ? (
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
            <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span>
                {lang === 'el'
                  ? 'Επίλεξε 1 ή περισσότερες παραγράφους για να δουλέψεις στοχευμένα με την ΑΙ:'
                  : 'Select 1 or more paragraphs to focus your AI editing & rewrites:'}
              </span>
              {selectedParagraphIndexes.length > 0 && (
                <button
                  onClick={handleClearSelection}
                  className="text-xs font-semibold underline cursor-pointer"
                  style={{ color: 'var(--accent)' }}
                >
                  {lang === 'el' ? 'Καθαρισμός επιλογής' : 'Clear selection'}
                </button>
              )}
            </div>

            {paragraphs.length === 0 ? (
              <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>
                {lang === 'el'
                  ? 'Γράψε πρώτα κείμενο στη λειτουργία «Γραφή».'
                  : 'Write some text in Write mode first.'}
              </p>
            ) : (
              paragraphs.map((para, idx) => {
                const isSelected = selectedParagraphIndexes.includes(idx);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleParagraphSelection(idx)}
                    className={`rounded-xl border p-4 transition-all cursor-pointer ${fontClass}`}
                    style={{
                      fontSize: `${book.settings.fontSize}px`,
                      backgroundColor: isSelected ? 'var(--accent-soft)' : 'var(--bg-surface)',
                      borderColor: isSelected ? 'var(--accent)' : 'var(--border-subtle)',
                    }}
                  >
                    <div className="mb-1.5 flex items-center justify-between font-sans-book text-[11px]">
                      <span
                        className="font-semibold"
                        style={{ color: isSelected ? 'var(--accent)' : 'var(--text-muted)' }}
                      >
                        {lang === 'el' ? `Παράγραφος ${idx + 1}` : `Paragraph ${idx + 1}`}
                      </span>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="accent-current"
                      />
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap">{para}</p>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <>
            {(viewMode === 'write' || viewMode === 'split') && (
              <div
                className={`flex-1 flex flex-col overflow-hidden ${
                  viewMode === 'split' ? 'border-r' : ''
                }`}
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <textarea
                  ref={textareaRef}
                  id="chapter-markdown-editor"
                  value={chapter.content}
                  onSelect={handleTextareaSelect}
                  onChange={(e) =>
                    onUpdateChapter({
                      ...chapter,
                      content: e.target.value,
                      status:
                        chapter.status === 'planned' && e.target.value.trim().length > 0
                          ? 'draft'
                          : chapter.status,
                    })
                  }
                  placeholder={t(lang, 'chapterPlaceholder')}
                  className={`h-full w-full resize-none bg-transparent px-5 py-5 md:px-7 outline-none leading-relaxed ${fontClass}`}
                  style={{
                    fontSize: `${book.settings.fontSize}px`,
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            )}

            {(viewMode === 'preview' || viewMode === 'split') && (
              <div
                className="flex-1 overflow-y-auto px-6 py-5"
                style={{ backgroundColor: 'var(--bg-surface)' }}
              >
                <div
                  className={`book-prose mx-auto max-w-2xl ${fontClass}`}
                  style={{ fontSize: `${book.settings.fontSize}px` }}
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdownHtml(
                      chapter.content || `*${t(lang, 'chapterPlaceholder')}*`
                    ),
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Status Footer */}
      <div
        className="flex items-center justify-between border-t px-4 py-1.5 text-[11px]"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-muted)',
        }}
      >
        <span>
          {wc.toLocaleString()} {t(lang, 'words')} • {paragraphs.length}{' '}
          {lang === 'el' ? 'παράγραφοι' : 'paragraphs'}
        </span>
        <span>
          {lang === 'el'
            ? 'Επίλεξε κείμενο ή «Παράγραφοι» για στοχευμένη επιμέλεια'
            : 'Highlight text or use Paragraphs for targeted AI edits'}
        </span>
      </div>
    </section>
  );
};
