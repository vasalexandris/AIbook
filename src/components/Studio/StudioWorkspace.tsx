import React, { useState } from 'react';
import {
  analyzeRippleEffect,
  summarizeChapterAndUpdateBible,
} from '../../services/ai';
import {
  AIProviderConfig,
  Book,
  BookFontFamily,
  Chapter,
  RippleAnalysisResult,
  RippleImpactItem,
  UILanguage,
} from '../../types/book';
import { uid } from '../../utils/bookUtils';
import { AICouncilPanel } from './AICouncilPanel';
import { ChapterBibleSidebar } from './ChapterBibleSidebar';
import { ChapterEditor } from './ChapterEditor';
import { RippleEffectModal } from './RippleEffectModal';

interface StudioWorkspaceProps {
  lang: UILanguage;
  book: Book;
  aiConfig: AIProviderConfig;
  onUpdateBook: (book: Book) => void;
  onOpenSettings: () => void;
}

export const StudioWorkspace: React.FC<StudioWorkspaceProps> = ({
  lang,
  book,
  aiConfig,
  onUpdateBook,
  onOpenSettings,
}) => {
  const [activeChapterId, setActiveChapterId] = useState<string>(
    book.chapters[0]?.id || ''
  );
  const [mobilePane, setMobilePane] = useState<'chapters' | 'editor' | 'ai'>('editor');

  const [completing, setCompleting] = useState(false);
  const [checkingRipple, setCheckingRipple] = useState(false);
  const [rippleResult, setRippleResult] = useState<RippleAnalysisResult | null>(null);
  const [studioNotice, setStudioNotice] = useState<string | null>(null);

  const activeChapter =
    book.chapters.find((c) => c.id === activeChapterId) || book.chapters[0];

  const handleUpdateChapter = (updated: Chapter) => {
    const nextChapters = book.chapters.map((c) =>
      c.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : c
    );
    onUpdateBook({ ...book, chapters: nextChapters });
  };

  const handleAddChapter = () => {
    const nextNum = book.chapters.length + 1;
    const newCh: Chapter = {
      id: uid('ch'),
      number: nextNum,
      title: lang === 'el' ? `Κεφάλαιο ${nextNum}` : `Chapter ${nextNum}`,
      outline: '',
      content: '',
      summary: '',
      status: 'planned',
      chatHistory: [],
      updatedAt: new Date().toISOString(),
    };
    onUpdateBook({ ...book, chapters: [...book.chapters, newCh] });
    setActiveChapterId(newCh.id);
    setMobilePane('editor');
  };

  const handleDeleteChapter = (id: string) => {
    if (book.chapters.length <= 1) return;
    const remaining = book.chapters
      .filter((c) => c.id !== id)
      .map((c, idx) => ({ ...c, number: idx + 1 }));
    onUpdateBook({ ...book, chapters: remaining });
    if (activeChapterId === id) {
      setActiveChapterId(remaining[0].id);
    }
  };

  const handleUpdateFont = (fontFamily: BookFontFamily, fontSize: number) => {
    onUpdateBook({
      ...book,
      settings: { ...book.settings, fontFamily, fontSize },
    });
  };

  const handleInsertToEditor = (text: string) => {
    if (!activeChapter) return;
    const separator = activeChapter.content.trim() ? '\n\n' : '';
    handleUpdateChapter({
      ...activeChapter,
      content: `${activeChapter.content}${separator}${text}`,
      status: activeChapter.status === 'planned' ? 'draft' : activeChapter.status,
    });
    setMobilePane('editor');
  };

  const handleCheckRipple = async () => {
    if (!activeChapter) return;
    if (!aiConfig.apiKey) {
      onOpenSettings();
      return;
    }
    setCheckingRipple(true);
    setStudioNotice(null);
    try {
      const res = await analyzeRippleEffect(aiConfig, book, activeChapter);
      setRippleResult(res);
    } catch (err) {
      setStudioNotice(err instanceof Error ? err.message : 'Ripple check error');
    } finally {
      setCheckingRipple(false);
    }
  };

  const handleCompleteChapter = async () => {
    if (!activeChapter) return;
    if (!aiConfig.apiKey) {
      onOpenSettings();
      return;
    }
    setCompleting(true);
    setStudioNotice(null);
    try {
      const update = await summarizeChapterAndUpdateBible(aiConfig, book, activeChapter);

      // Merge entities into Book Bible
      const mergedEntities = [...book.bible.entities];
      for (const ne of update.newOrUpdatedEntities || []) {
        const existingIdx = mergedEntities.findIndex(
          (e) => e.name.toLowerCase() === ne.name.toLowerCase()
        );
        if (existingIdx >= 0) {
          mergedEntities[existingIdx] = {
            ...mergedEntities[existingIdx],
            description: ne.description || mergedEntities[existingIdx].description,
            currentStatus: ne.currentStatus || mergedEntities[existingIdx].currentStatus,
          };
        } else {
          mergedEntities.push({
            id: uid('ent'),
            name: ne.name,
            category: ne.category || 'concept',
            description: ne.description,
            currentStatus: ne.currentStatus,
          });
        }
      }

      // Merge open threads
      const mergedThreads = [...book.bible.openThreads];
      for (const nt of update.openThreads || []) {
        const existingIdx = mergedThreads.findIndex(
          (th) => th.title.toLowerCase() === nt.title.toLowerCase()
        );
        if (existingIdx >= 0) {
          mergedThreads[existingIdx] = {
            ...mergedThreads[existingIdx],
            status: nt.status,
            notes: nt.notes || mergedThreads[existingIdx].notes,
          };
        } else {
          mergedThreads.push({
            id: uid('thr'),
            title: nt.title,
            status: nt.status || 'open',
            notes: nt.notes || '',
          });
        }
      }

      const updatedChapter: Chapter = {
        ...activeChapter,
        summary: update.chapterSummary,
        status: 'completed',
        updatedAt: new Date().toISOString(),
      };

      const updatedBook: Book = {
        ...book,
        bible: {
          ...book.bible,
          entities: mergedEntities,
          openThreads: mergedThreads,
        },
        chapters: book.chapters.map((c) => (c.id === updatedChapter.id ? updatedChapter : c)),
      };

      onUpdateBook(updatedBook);

      // Automatically run Ripple Effect check if there are other chapters with content
      const hasOtherContent = updatedBook.chapters.some(
        (c) => c.id !== updatedChapter.id && (c.content.trim() || c.outline.trim())
      );
      if (hasOtherContent) {
        const ripple = await analyzeRippleEffect(aiConfig, updatedBook, updatedChapter);
        setRippleResult(ripple);
      } else {
        setStudioNotice(
          lang === 'el'
            ? 'Το κεφάλαιο ολοκληρώθηκε και η Βίβλος του Βιβλίου ενημερώθηκε!'
            : 'Chapter completed and Book Bible updated!'
        );
      }
    } catch (err) {
      setStudioNotice(err instanceof Error ? err.message : 'Error completing chapter');
    } finally {
      setCompleting(false);
    }
  };

  const handleApproveRippleImpact = (impact: RippleImpactItem) => {
    const target = book.chapters.find((c) => c.id === impact.chapterId);
    if (!target) return;

    let newContent = target.content;
    let newOutline = target.outline;

    if (impact.originalExcerpt && newContent.includes(impact.originalExcerpt)) {
      newContent = newContent.replace(impact.originalExcerpt, impact.suggestedReplacement);
    } else if (impact.originalExcerpt && newOutline.includes(impact.originalExcerpt)) {
      newOutline = newOutline.replace(impact.originalExcerpt, impact.suggestedReplacement);
    } else {
      // Append editorial update cleanly if exact substring wasn't matched verbatim
      newContent = `${newContent}\n\n${impact.suggestedReplacement}`.trim();
    }

    onUpdateBook({
      ...book,
      chapters: book.chapters.map((c) =>
        c.id === target.id
          ? { ...c, content: newContent, outline: newOutline, updatedAt: new Date().toISOString() }
          : c
      ),
    });

    setRippleResult((prev) =>
      prev
        ? {
            ...prev,
            impacts: prev.impacts.map((x) =>
              x.chapterId === impact.chapterId && x.reason === impact.reason
                ? { ...x, applied: true }
                : x
            ),
          }
        : null
    );
  };

  const handleDismissRippleImpact = (impact: RippleImpactItem) => {
    setRippleResult((prev) =>
      prev
        ? {
            ...prev,
            impacts: prev.impacts.map((x) =>
              x.chapterId === impact.chapterId && x.reason === impact.reason
                ? { ...x, dismissed: true }
                : x
            ),
          }
        : null
    );
  };

  if (!activeChapter) return null;

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col overflow-hidden">
      {/* Mobile Pane Switcher */}
      <div
        className="flex lg:hidden border-b text-xs font-semibold"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {(
          [
            { id: 'chapters', label: lang === 'el' ? 'Κεφάλαια & Βίβλος' : 'Chapters & Bible' },
            { id: 'editor', label: lang === 'el' ? 'Κειμενογράφος' : 'Editor' },
            { id: 'ai', label: lang === 'el' ? 'AI Συμβούλιο' : 'AI Council' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMobilePane(tab.id)}
            className="flex-1 py-2.5 text-center border-b-2 cursor-pointer"
            style={{
              borderColor: mobilePane === tab.id ? 'var(--accent)' : 'transparent',
              color: mobilePane === tab.id ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {studioNotice && (
        <div
          className="flex items-center justify-between border-b px-4 py-2 text-xs"
          style={{
            backgroundColor: 'var(--sage-soft)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--sage)',
          }}
        >
          <span>{studioNotice}</span>
          <button onClick={() => setStudioNotice(null)} className="font-bold cursor-pointer">
            ×
          </button>
        </div>
      )}

      {/* 3-Column Studio Grid */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Chapters & Book Bible */}
        <div
          className={`${
            mobilePane === 'chapters' ? 'block w-full' : 'hidden'
          } lg:block lg:w-64 xl:w-72 shrink-0 h-full overflow-hidden`}
        >
          <ChapterBibleSidebar
            lang={lang}
            book={book}
            activeChapterId={activeChapter.id}
            onSelectChapter={(id) => {
              setActiveChapterId(id);
              setMobilePane('editor');
            }}
            onAddChapter={handleAddChapter}
            onDeleteChapter={handleDeleteChapter}
            onUpdateBook={onUpdateBook}
          />
        </div>

        {/* Center: Chapter Editor */}
        <div
          className={`${
            mobilePane === 'editor' ? 'block w-full' : 'hidden'
          } lg:block flex-1 h-full overflow-hidden min-w-0`}
        >
          <ChapterEditor
            lang={lang}
            book={book}
            chapter={activeChapter}
            aiConfig={aiConfig}
            completing={completing}
            checkingRipple={checkingRipple}
            onUpdateChapter={handleUpdateChapter}
            onUpdateFont={handleUpdateFont}
            onCompleteChapter={handleCompleteChapter}
            onCheckRipple={handleCheckRipple}
            onOpenSettings={onOpenSettings}
          />
        </div>

        {/* Right: AI Council Panel */}
        <div
          className={`${
            mobilePane === 'ai' ? 'block w-full' : 'hidden'
          } lg:block lg:w-80 xl:w-96 shrink-0 h-full overflow-hidden`}
        >
          <AICouncilPanel
            lang={lang}
            book={book}
            chapter={activeChapter}
            aiConfig={aiConfig}
            onUpdateChapter={handleUpdateChapter}
            onInsertToEditor={handleInsertToEditor}
            onOpenSettings={onOpenSettings}
          />
        </div>
      </div>

      {/* Ripple Effect Approval Modal */}
      {rippleResult && (
        <RippleEffectModal
          lang={lang}
          result={rippleResult}
          onApproveImpact={handleApproveRippleImpact}
          onDismissImpact={handleDismissRippleImpact}
          onClose={() => setRippleResult(null)}
        />
      )}
    </div>
  );
};
