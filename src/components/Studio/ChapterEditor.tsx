import React, { useRef, useState } from 'react';
import {
  Bold,
  CheckCircle2,
  Download,
  Eye,
  GitCompare,
  Heading2,
  ImagePlus,
  Italic,
  Loader2,
  Quote,
  Sparkles,
  SplitSquareHorizontal,
  Table,
  Type,
  Edit3,
} from 'lucide-react';
import { t } from '../../i18n/translations';
import { generateBookImage } from '../../services/ai';
import { downloadTextFile } from '../../services/storage';
import { AIProviderConfig, Book, BookFontFamily, Chapter, UILanguage } from '../../types/book';
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
  onUpdateChapter: (updated: Chapter) => void;
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
  onUpdateChapter,
  onUpdateFont,
  onCompleteChapter,
  onCheckRipple,
  onOpenSettings,
}) => {
  const [viewMode, setViewMode] = useState<'write' | 'split' | 'preview'>('write');
  const [showImagePrompt, setShowImagePrompt] = useState(false);
  const [imgPrompt, setImgPrompt] = useState('');
  const [generatingImg, setGeneratingImg] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fontClass = getFontClass(book.settings.fontFamily);
  const wc = countWords(chapter.content);

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
    <section className="flex h-full flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg-canvas)' }}>
      {/* Chapter Header + Actions */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
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
            className="min-w-0 flex-1 bg-transparent font-editorial text-lg font-semibold outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={handleDownloadChapter}
            title={t(lang, 'saveChapterLocal')}
            className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium cursor-pointer"
            style={{
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-canvas)',
            }}
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">{t(lang, 'saveChapterLocal')}</span>
          </button>

          <button
            id="btn-check-ripple"
            onClick={onCheckRipple}
            disabled={checkingRipple}
            className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-opacity disabled:opacity-50 cursor-pointer"
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
            <span>{checkingRipple ? t(lang, 'checkingRipple') : t(lang, 'checkRippleBtn')}</span>
          </button>

          <button
            id="btn-complete-chapter"
            onClick={onCompleteChapter}
            disabled={completing || !chapter.content.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white transition-opacity disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: 'var(--sage)' }}
          >
            {completing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            <span>{completing ? t(lang, 'completingChapter') : t(lang, 'completeChapterBtn')}</span>
          </button>
        </div>
      </div>

      {/* Formatting & View Toolbar */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-1.5 text-xs"
        style={{
          backgroundColor: 'var(--bg-subtle)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {/* Markdown Tools */}
        <div className="flex flex-wrap items-center gap-1">
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
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium hover:opacity-80 cursor-pointer"
          >
            <Table className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t(lang, 'insertTable')}</span>
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
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium hover:opacity-80 cursor-pointer"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t(lang, 'uploadImage')}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowImagePrompt((v) => !v)}
            title={t(lang, 'aiImage')}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium hover:opacity-80 cursor-pointer"
            style={{ color: 'var(--accent)' }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t(lang, 'aiImage')}</span>
          </button>
        </div>

        {/* Font + View Mode */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1">
            <Type className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
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
                { id: 'split', icon: SplitSquareHorizontal, label: t(lang, 'splitMode') },
                { id: 'preview', icon: Eye, label: t(lang, 'previewMode') },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => setViewMode(m.id)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium cursor-pointer"
                style={{
                  backgroundColor: viewMode === m.id ? 'var(--bg-subtle)' : 'transparent',
                  color: viewMode === m.id ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                <m.icon className="h-3 w-3" />
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

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
                  ? 'Περίγραψε την εικόνα που θέλεις (π.χ. Minimalist charcoal sketch of ancient Athens skyline at dusk)...'
                  : 'Describe the illustration (e.g. Minimalist editorial ink drawing of a lighthouse in fog)...'
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
        className="border-b px-4 py-2"
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

      {/* Main Editor / Preview Area */}
      <div className="flex-1 overflow-hidden flex">
        {(viewMode === 'write' || viewMode === 'split') && (
          <div className={`flex-1 flex flex-col overflow-hidden ${viewMode === 'split' ? 'border-r' : ''}`} style={{ borderColor: 'var(--border-subtle)' }}>
            <textarea
              ref={textareaRef}
              id="chapter-markdown-editor"
              value={chapter.content}
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
              className={`h-full w-full resize-none bg-transparent px-6 py-6 md:px-10 outline-none leading-relaxed ${fontClass}`}
              style={{
                fontSize: `${book.settings.fontSize}px`,
                color: 'var(--text-primary)',
              }}
            />
          </div>
        )}

        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            className="flex-1 overflow-y-auto px-6 py-6 md:px-10"
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <div
              className={`book-prose mx-auto max-w-2xl ${fontClass}`}
              style={{ fontSize: `${book.settings.fontSize}px` }}
              dangerouslySetInnerHTML={{
                __html: renderMarkdownHtml(chapter.content || `*${t(lang, 'chapterPlaceholder')}*`),
              }}
            />
          </div>
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
          {wc.toLocaleString()} {t(lang, 'words')}
        </span>
        <span>
          {chapter.status === 'completed'
            ? t(lang, 'statusCompleted')
            : chapter.status === 'draft'
            ? t(lang, 'statusDraft')
            : t(lang, 'statusPlanned')}
        </span>
      </div>
    </section>
  );
};
