import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  Check,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { BOOK_GENRES } from '../../data/genres';
import { t } from '../../i18n/translations';
import { generateBookBlueprint, onboardingBrainstorm } from '../../services/ai';
import { AIProviderConfig, BibleEntity, Book, BookFontFamily, UILanguage } from '../../types/book';
import { BOOK_FONT_OPTIONS, getFontClass, renderMarkdownHtml, uid } from '../../utils/bookUtils';

interface NewBookWizardProps {
  lang: UILanguage;
  aiConfig: AIProviderConfig;
  onCreateBook: (book: Book) => void;
  onCancel: () => void;
  onOpenSettings: () => void;
}

interface DraftChapterOutline {
  id: string;
  title: string;
  outline: string;
}

interface BrainstormTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const NewBookWizard: React.FC<NewBookWizardProps> = ({
  lang,
  aiConfig,
  onCreateBook,
  onCancel,
  onOpenSettings,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1
  const [genreId, setGenreId] = useState('novel');
  const [idea, setIdea] = useState('');
  const [brainstormMessages, setBrainstormMessages] = useState<BrainstormTurn[]>([]);
  const [followUpInput, setFollowUpInput] = useState('');
  const [brainstorming, setBrainstorming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Step 2
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [bookLanguage, setBookLanguage] = useState(lang === 'el' ? 'Ελληνικά' : 'English');
  const [tone, setTone] = useState(
    lang === 'el' ? BOOK_GENRES[1].defaultToneEl : BOOK_GENRES[1].defaultToneEn
  );
  const [targetAudience, setTargetAudience] = useState(
    lang === 'el' ? 'Ενήλικες αναγνώστες' : 'General adult readers'
  );
  const [fontFamily, setFontFamily] = useState<BookFontFamily>('literata');
  const [includeImages, setIncludeImages] = useState(false);
  const [includeTables, setIncludeTables] = useState(false);
  const [includeFootnotes, setIncludeFootnotes] = useState(false);
  const [includeBibliography, setIncludeBibliography] = useState(false);
  const [specialNotes, setSpecialNotes] = useState('');

  // Step 3
  const [premise, setPremise] = useState('');
  const [purpose, setPurpose] = useState('');
  const [styleGuidelines, setStyleGuidelines] = useState('');
  const [initialEntities, setInitialEntities] = useState<BibleEntity[]>([]);
  const [chapters, setChapters] = useState<DraftChapterOutline[]>([
    {
      id: uid('ch'),
      title: lang === 'el' ? 'Κεφάλαιο 1: Εισαγωγή' : 'Chapter 1: Opening',
      outline: '',
    },
    {
      id: uid('ch'),
      title: lang === 'el' ? 'Κεφάλαιο 2: Ανάπτυξη' : 'Chapter 2: Development',
      outline: '',
    },
    {
      id: uid('ch'),
      title: lang === 'el' ? 'Κεφάλαιο 3: Κλιμάκωση' : 'Chapter 3: Turning Point',
      outline: '',
    },
  ]);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedGenre = BOOK_GENRES.find((g) => g.id === genreId) || BOOK_GENRES[0];
  const selectedGenreLabel = lang === 'el' ? selectedGenre.nameEl : selectedGenre.nameEn;

  const handleSelectGenre = (id: string) => {
    setGenreId(id);
    const g = BOOK_GENRES.find((x) => x.id === id);
    if (g) {
      setTone(lang === 'el' ? g.defaultToneEl : g.defaultToneEn);
      if (g.isNonFiction) {
        setIncludeTables(true);
        setIncludeBibliography(true);
      }
    }
  };

  const runBrainstormTurn = async (userText: string, isInitial: boolean) => {
    if (!aiConfig.apiKey) {
      onOpenSettings();
      return;
    }
    const trimmed = userText.trim();
    if (!trimmed) return;

    setError(null);
    setBrainstorming(true);

    const userTurn: BrainstormTurn = {
      id: uid('bt'),
      role: 'user',
      content: trimmed,
    };

    const nextHistory = isInitial ? [userTurn] : [...brainstormMessages, userTurn];
    setBrainstormMessages(nextHistory);
    if (!isInitial) setFollowUpInput('');

    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    try {
      const reply = await onboardingBrainstorm(
        aiConfig,
        nextHistory.map((m) => ({ role: m.role, content: m.content })),
        selectedGenreLabel,
        bookLanguage
      );
      setBrainstormMessages((prev) => [
        ...prev,
        { id: uid('bt'), role: 'assistant', content: reply },
      ]);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error brainstorming with AI');
    } finally {
      setBrainstorming(false);
    }
  };

  const handleBrainstorm = () => runBrainstormTurn(idea, true);

  const handleFollowUpSend = () => runBrainstormTurn(followUpInput, false);

  const handleGenerateBlueprint = async () => {
    if (!aiConfig.apiKey) {
      onOpenSettings();
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      const specialElements = [
        includeImages ? 'Images / Illustrations' : '',
        includeTables ? 'Data Tables' : '',
        includeFootnotes ? 'Footnotes' : '',
        includeBibliography ? 'Bibliography & Citations' : '',
      ].filter(Boolean);

      const conversationTranscript =
        brainstormMessages.length > 0
          ? brainstormMessages
              .map((m) => `${m.role === 'user' ? 'Author' : 'Editor'}: ${m.content}`)
              .join('\n\n')
          : '';

      const bp = await generateBookBlueprint(aiConfig, {
        idea:
          `${idea}${conversationTranscript ? `\n\nDiscovery conversation:\n${conversationTranscript}` : ''}` ||
          selectedGenreLabel,
        genreLabel: selectedGenreLabel,
        language: bookLanguage,
        tone,
        targetAudience,
        specialElements,
        specialNotes,
      });

      if (!title.trim() && bp.title) setTitle(bp.title);
      if (!subtitle.trim() && bp.subtitle) setSubtitle(bp.subtitle);
      if (bp.premise) setPremise(bp.premise);
      if (bp.purpose) setPurpose(bp.purpose);
      if (bp.styleGuidelines) setStyleGuidelines(bp.styleGuidelines);
      if (Array.isArray(bp.chapters) && bp.chapters.length > 0) {
        setChapters(
          bp.chapters.map((c) => ({
            id: uid('ch'),
            title: c.title,
            outline: c.outline,
          }))
        );
      }
      if (Array.isArray(bp.initialEntities)) {
        setInitialEntities(
          bp.initialEntities.map((e) => ({
            id: uid('ent'),
            name: e.name,
            category: e.category || 'concept',
            description: e.description,
            currentStatus: '',
          }))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating blueprint');
    } finally {
      setGenerating(false);
    }
  };

  const handleFinish = () => {
    const now = new Date().toISOString();
    const book: Book = {
      id: uid('book'),
      title: title.trim() || (lang === 'el' ? 'Νέο Βιβλίο Χωρίς Τίτλο' : 'Untitled Book'),
      subtitle: subtitle.trim(),
      authorName: authorName.trim(),
      genreId,
      genreLabel: selectedGenreLabel,
      settings: {
        language: bookLanguage,
        fontFamily,
        fontSize: 18,
        tone,
        targetAudience,
        includeImages,
        includeTables,
        includeFootnotes,
        includeBibliography,
        specialNotes,
      },
      bible: {
        premise: premise.trim() || idea.trim(),
        purpose: purpose.trim(),
        styleGuidelines: styleGuidelines.trim() || tone,
        entities: initialEntities,
        openThreads: [],
        researchItems: [],
      },
      chapters: chapters.map((ch, idx) => ({
        id: ch.id,
        number: idx + 1,
        title: ch.title.trim() || `Chapter ${idx + 1}`,
        outline: ch.outline.trim(),
        content: '',
        summary: '',
        status: 'planned',
        chatHistory: [],
        updatedAt: now,
      })),
      createdAt: now,
      updatedAt: now,
    };
    onCreateBook(book);
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-editorial text-2xl md:text-3xl font-semibold">
            {t(lang, 'wizardTitle')}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {([1, 2, 3] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStep(s)}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium transition-colors cursor-pointer"
                style={{
                  backgroundColor: step === s ? 'var(--accent)' : 'var(--bg-subtle)',
                  color: step === s ? '#ffffff' : 'var(--text-secondary)',
                }}
              >
                {step > s && <Check className="h-3 w-3" />}
                <span>
                  {s === 1
                    ? t(lang, 'step1Title')
                    : s === 2
                    ? t(lang, 'step2Title')
                    : t(lang, 'step3Title')}
                </span>
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-xs font-medium underline cursor-pointer"
          style={{ color: 'var(--text-muted)' }}
        >
          {t(lang, 'close')}
        </button>
      </div>

      {error && (
        <div
          className="mb-5 rounded-xl border p-3.5 text-xs"
          style={{
            backgroundColor: 'var(--danger-soft)',
            borderColor: 'var(--danger)',
            color: 'var(--danger)',
          }}
        >
          {error}
        </div>
      )}

      <div
        className="rounded-2xl border p-6 md:p-8"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          boxShadow: 'var(--shadow-paper)',
        }}
      >
        {/* STEP 1: GENRE & IDEA */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-editorial text-xl font-semibold">
                {t(lang, 'chooseGenrePrompt')}
              </h2>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {BOOK_GENRES.map((g) => {
                  const active = g.id === genreId;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => handleSelectGenre(g.id)}
                      className="rounded-xl border p-3.5 text-left transition-all cursor-pointer"
                      style={{
                        borderColor: active ? 'var(--accent)' : 'var(--border-subtle)',
                        backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-canvas)',
                      }}
                    >
                      <div className="text-sm font-semibold">
                        {lang === 'el' ? g.nameEl : g.nameEn}
                      </div>
                      <div
                        className="mt-1 text-[11px] leading-snug"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {lang === 'el' ? g.descEl : g.descEn}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>
                {t(lang, 'ideaInputLabel')}
              </label>
              <textarea
                id="input-book-idea"
                rows={4}
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder={t(lang, 'ideaInputPlaceholder')}
                className="w-full rounded-xl border p-3.5 text-sm leading-relaxed outline-none"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
              <div className="mt-2.5 flex items-center justify-between gap-3">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {lang === 'el'
                    ? 'Δεν είσαι σίγουρος για το είδος ή τη γωνία; Ζήτα γνώμη από την ΑΙ.'
                    : 'Not sure about genre or angle yet? Brainstorm directly with AI.'}
                </span>
                <button
                  id="btn-brainstorm-idea"
                  type="button"
                  onClick={handleBrainstorm}
                  disabled={brainstorming || !idea.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-opacity disabled:opacity-50 cursor-pointer"
                  style={{
                    borderColor: 'var(--accent)',
                    backgroundColor: 'var(--accent-soft)',
                    color: 'var(--accent)',
                  }}
                >
                  {brainstorming && brainstormMessages.length <= 1 ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <MessageSquare className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {brainstorming && brainstormMessages.length <= 1
                      ? t(lang, 'brainstorming')
                      : brainstormMessages.length > 0
                      ? lang === 'el'
                        ? 'Επανεκκίνηση Συζήτησης'
                        : 'Restart Discussion'
                      : t(lang, 'brainstormWithAI')}
                  </span>
                </button>
              </div>

              {brainstormMessages.length > 0 && (
                <div
                  className="mt-4 rounded-2xl border overflow-hidden"
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    borderColor: 'var(--border-strong)',
                  }}
                >
                  {/* Chat Header */}
                  <div
                    className="flex items-center justify-between border-b px-4 py-2.5"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div
                      className="flex items-center gap-1.5 text-xs font-semibold"
                      style={{ color: 'var(--accent)' }}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>
                        {lang === 'el'
                          ? 'Διαδραστική Συζήτηση με τον AI Literary Editor'
                          : 'Interactive Discovery with AI Literary Editor'}
                      </span>
                    </div>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {lang === 'el'
                        ? 'Όλη η συζήτηση μεταφέρεται αυτόματα στο Βήμα 3'
                        : 'Full conversation carries over to Step 3'}
                    </span>
                  </div>

                  {/* Messages Thread */}
                  <div className="max-h-[420px] overflow-y-auto p-4 space-y-3">
                    {brainstormMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`rounded-xl p-3.5 text-sm ${
                          msg.role === 'user' ? 'ml-8 border' : 'mr-4 border'
                        }`}
                        style={{
                          backgroundColor:
                            msg.role === 'user' ? 'var(--accent-soft)' : 'var(--bg-surface)',
                          borderColor:
                            msg.role === 'user' ? 'var(--border-strong)' : 'var(--border-subtle)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <div
                          className="mb-1 text-[10px] font-semibold uppercase tracking-wide"
                          style={{
                            color: msg.role === 'user' ? 'var(--accent)' : 'var(--sage)',
                          }}
                        >
                          {msg.role === 'user'
                            ? lang === 'el'
                              ? 'Εσύ'
                              : 'You'
                            : 'AI Literary Editor'}
                        </div>
                        <div
                          className="book-prose text-sm"
                          dangerouslySetInnerHTML={{ __html: renderMarkdownHtml(msg.content) }}
                        />
                      </div>
                    ))}

                    {brainstorming && (
                      <div
                        className="flex items-center gap-2 px-2 py-1 text-xs"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>{t(lang, 'brainstorming')}</span>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Follow-up Reply Input */}
                  <div
                    className="border-t p-3"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="flex items-end gap-2">
                      <textarea
                        id="input-brainstorm-reply"
                        rows={2}
                        value={followUpInput}
                        onChange={(e) => setFollowUpInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleFollowUpSend();
                          }
                        }}
                        placeholder={
                          lang === 'el'
                            ? 'Απάντησε στις ερωτήσεις της ΑΙ ή πρόσθεσε νέες σκέψεις (Enter για αποστολή)...'
                            : 'Answer the AI’s questions or explore further (Press Enter to send)...'
                        }
                        className="flex-1 resize-none rounded-xl border px-3 py-2 text-sm outline-none"
                        style={{
                          backgroundColor: 'var(--bg-canvas)',
                          borderColor: 'var(--border-strong)',
                          color: 'var(--text-primary)',
                        }}
                      />
                      <button
                        id="btn-send-brainstorm-reply"
                        type="button"
                        onClick={handleFollowUpSend}
                        disabled={brainstorming || !followUpInput.trim()}
                        className="inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-xs font-semibold text-white transition-opacity disabled:opacity-50 cursor-pointer"
                        style={{ backgroundColor: 'var(--accent)' }}
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>{lang === 'el' ? 'Αποστολή' : 'Send'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: STYLE, TYPOGRAPHY & SPECIAL ELEMENTS */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  {t(lang, 'bookTitleLabel')}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={lang === 'el' ? 'Άφησέ το κενό για πρόταση από ΑΙ' : 'Leave blank for AI suggestion'}
                  className="w-full rounded-lg border px-3.5 py-2 text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--bg-canvas)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  {t(lang, 'authorNameLabel')}
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder={lang === 'el' ? 'Το όνομά σου' : 'Your name'}
                  className="w-full rounded-lg border px-3.5 py-2 text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--bg-canvas)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  {t(lang, 'bookLanguageLabel')}
                </label>
                <input
                  type="text"
                  value={bookLanguage}
                  onChange={(e) => setBookLanguage(e.target.value)}
                  className="w-full rounded-lg border px-3.5 py-2 text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--bg-canvas)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  {t(lang, 'audienceLabel')}
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full rounded-lg border px-3.5 py-2 text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--bg-canvas)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                {t(lang, 'toneLabel')}
              </label>
              <input
                type="text"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full rounded-lg border px-3.5 py-2 text-sm outline-none"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* Typography Picker */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>
                {t(lang, 'typographyLabel')}
              </label>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {BOOK_FONT_OPTIONS.map((opt) => {
                  const active = opt.id === fontFamily;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFontFamily(opt.id)}
                      className="rounded-xl border p-3 text-left transition-colors cursor-pointer"
                      style={{
                        borderColor: active ? 'var(--accent)' : 'var(--border-subtle)',
                        backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-canvas)',
                      }}
                    >
                      <div className="text-xs font-semibold">{opt.label}</div>
                      <div className={`mt-1 text-sm ${getFontClass(opt.id)}`} style={{ color: 'var(--text-secondary)' }}>
                        {opt.sample}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Special Elements */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>
                {t(lang, 'specialElementsLabel')}
              </label>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {[
                  { label: t(lang, 'includeImages'), checked: includeImages, set: setIncludeImages },
                  { label: t(lang, 'includeTables'), checked: includeTables, set: setIncludeTables },
                  { label: t(lang, 'includeFootnotes'), checked: includeFootnotes, set: setIncludeFootnotes },
                  { label: t(lang, 'includeBibliography'), checked: includeBibliography, set: setIncludeBibliography },
                ].map((item) => (
                  <label
                    key={item.label}
                    className="flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm cursor-pointer"
                    style={{
                      borderColor: item.checked ? 'var(--sage)' : 'var(--border-subtle)',
                      backgroundColor: item.checked ? 'var(--sage-soft)' : 'var(--bg-canvas)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => item.set(e.target.checked)}
                      className="accent-current"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                {t(lang, 'specialNotesLabel')}
              </label>
              <textarea
                rows={2}
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder={lang === 'el' ? 'Π.χ. αφήγηση σε α’ πρόσωπο, σύντομα κεφάλαια, παραδείγματα κώδικα...' : 'e.g. first-person POV, short punchy chapters, case studies...'}
                className="w-full rounded-lg border p-3 text-sm outline-none"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>
        )}

        {/* STEP 3: PREMISE, PURPOSE & OUTLINE */}
        {step === 3 && (
          <div className="space-y-5">
            <div
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-4"
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {lang === 'el'
                  ? 'Η ΑΙ μπορεί να συνθέσει αυτόματα Τίτλο, Περιγραφή, Σκοπό, αρχικές οντότητες για τη Βίβλο και Πλάνο Κεφαλαίων με βάση τα βήματα 1 & 2.'
                  : 'AI can synthesize a Title, Premise, Purpose, initial Book Bible entities, and Chapter Outline based on Steps 1 & 2.'}
              </div>
              <button
                id="btn-generate-blueprint"
                type="button"
                onClick={handleGenerateBlueprint}
                disabled={generating}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-opacity disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {generating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span>{generating ? t(lang, 'generatingBlueprint') : t(lang, 'generateBlueprint')}</span>
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  {t(lang, 'bookTitleLabel')}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border px-3.5 py-2 text-sm font-editorial font-semibold outline-none"
                  style={{
                    backgroundColor: 'var(--bg-canvas)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  {t(lang, 'bookSubtitleLabel')}
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full rounded-lg border px-3.5 py-2 text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--bg-canvas)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                {t(lang, 'premiseLabel')}
              </label>
              <textarea
                rows={3}
                value={premise}
                onChange={(e) => setPremise(e.target.value)}
                className="w-full rounded-lg border p-3 text-sm outline-none"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                {t(lang, 'purposeLabel')}
              </label>
              <textarea
                rows={2}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full rounded-lg border p-3 text-sm outline-none"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                  {t(lang, 'outlineLabel')} ({chapters.length})
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setChapters((prev) => [
                      ...prev,
                      {
                        id: uid('ch'),
                        title:
                          lang === 'el'
                            ? `Κεφάλαιο ${prev.length + 1}`
                            : `Chapter ${prev.length + 1}`,
                        outline: '',
                      },
                    ])
                  }
                  className="inline-flex items-center gap-1 text-xs font-semibold cursor-pointer"
                  style={{ color: 'var(--accent)' }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t(lang, 'addChapter')}</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {chapters.map((ch, idx) => (
                  <div
                    key={ch.id}
                    className="rounded-xl border p-3"
                    style={{
                      backgroundColor: 'var(--bg-canvas)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: 'var(--bg-subtle)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={ch.title}
                        onChange={(e) =>
                          setChapters((prev) =>
                            prev.map((x) => (x.id === ch.id ? { ...x, title: e.target.value } : x))
                          )
                        }
                        className="flex-1 bg-transparent text-sm font-semibold outline-none"
                      />
                      {chapters.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setChapters((prev) => prev.filter((x) => x.id !== ch.id))}
                          className="p-1 opacity-60 hover:opacity-100 cursor-pointer"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={2}
                      value={ch.outline}
                      onChange={(e) =>
                        setChapters((prev) =>
                          prev.map((x) => (x.id === ch.id ? { ...x, outline: e.target.value } : x))
                        )
                      }
                      placeholder={lang === 'el' ? 'Σύντομος στόχος / περιεχόμενο κεφαλαίου...' : 'Brief chapter goal / key beats...'}
                      className="mt-2 w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-secondary)',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Footer */}
        <div
          className="mt-8 flex items-center justify-between pt-5 border-t"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <button
            type="button"
            onClick={() => (step === 1 ? onCancel() : setStep((s) => (s - 1) as 1 | 2 | 3))}
            className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-medium cursor-pointer"
            style={{
              borderColor: 'var(--border-strong)',
              color: 'var(--text-secondary)',
            }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{step === 1 ? t(lang, 'close') : t(lang, 'prevStep')}</span>
          </button>

          {step < 3 ? (
            <button
              id="btn-wizard-next"
              type="button"
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
              className="inline-flex items-center gap-1.5 rounded-lg px-5 py-2 text-xs font-semibold text-white cursor-pointer"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <span>{t(lang, 'nextStep')}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              id="btn-wizard-create"
              type="button"
              onClick={handleFinish}
              className="inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-xs font-semibold text-white cursor-pointer"
              style={{ backgroundColor: 'var(--sage)' }}
            >
              <BookMarked className="h-4 w-4" />
              <span>{t(lang, 'createBookAndStart')}</span>
            </button>
          )}
        </div>
      </div>
    </main>
  );
};
