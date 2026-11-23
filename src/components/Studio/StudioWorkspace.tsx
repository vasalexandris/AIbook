import React, { useState } from 'react';
import { X } from 'lucide-react';
import {
  analyzeRippleEffect,
  summarizeChapterAndUpdateBible,
} from '../../services/ai';
import {
  AIProviderConfig,
  Book,
  BookFontFamily,
  Chapter,
  ChapterRevision,
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

  // Left sidebar is collapsed by default on desktop so Editor (40%) + AI Council (60%) get full width!
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedExcerpt, setSelectedExcerpt] = useState('');

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
      revisions: [],
      updatedAt: new Date().toISOString(),
    };
    onUpdateBook({ ...book, chapters: [...book.chapters, newCh] });
    setActiveChapterId(newCh.id);
    setSelectedExcerpt('');
    setSidebarOpen(false);
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
      setSelectedExcerpt('');
    }
  };

  const handleUpdateFont = (fontFamily: BookFontFamily, fontSize: number) => {
    onUpdateBook({
      ...book,
      settings: { ...book.settings, fontFamily, fontSize },
    });
  };

  const handleSaveSnapshot = (label: string) => {
    if (!activeChapter) return;
    const rev: ChapterRevision = {
      id: uid('rev'),
      timestamp: new Date().toISOString(),
      label,
      fullContent: activeChapter.content,
    };
    handleUpdateChapter({
      ...activeChapter,
      revisions: [rev, ...(activeChapter.revisions || [])].slice(0, 25),
    });
    setStudioNotice(
      lang === 'el' ? 'Αποθηκεύτηκε στιγμιότυπο κεφαλαίου.' : 'Chapter snapshot saved.'
    );
  };

  /**
   * Applies AI text either by replacing ONLY the selected passage or appending at the end,
   * automatically saving a selective revision snapshot so the user can undo that exact paragraph anytime!
   */
  const handleApplyText = (text: string, mode: 'replace' | 'append', label: string) => {
    if (!activeChapter) return;
    const cleanText = text.trim();
    if (!cleanText) return;

    let nextContent = activeChapter.content;
    let previousExcerpt: string | undefined;
    let newExcerpt: string | undefined;

    if (mode === 'replace' && selectedExcerpt && activeChapter.content.includes(selectedExcerpt)) {
      previousExcerpt = selectedExcerpt;
      newExcerpt = cleanText;
      nextContent = activeChapter.content.replace(selectedExcerpt, cleanText);
      setSelectedExcerpt(cleanText);
    } else {
      const separator = activeChapter.content.trim() ? '\n\n' : '';
      nextContent = `${activeChapter.content}${separator}${cleanText}`;
    }

    const rev: ChapterRevision = {
      id: uid('rev'),
      timestamp: new Date().toISOString(),
      label:
        mode === 'replace' && previousExcerpt
          ? `${lang === 'el' ? 'Πριν από αντικατάσταση' : 'Before replace'}: ${label}`
          : `${lang === 'el' ? 'Πριν από εισαγωγή' : 'Before insert'}: ${label}`,
      previousExcerpt,
      newExcerpt,
      fullContent: activeChapter.content,
    };

    handleUpdateChapter({
      ...activeChapter,
      content: nextContent,
      status: activeChapter.status === 'planned' ? 'draft' : activeChapter.status,
      revisions: [rev, ...(activeChapter.revisions || [])].slice(0, 25),
    });

    setStudioNotice(
      mode === 'replace' && previousExcerpt
        ? lang === 'el'
          ? 'Το επιλεγμένο κείμενο αντικαταστάθηκε! Η προηγούμενη εκδοχή αποθηκεύτηκε στο Ιστορικό.'
          : 'Selected passage replaced! Previous version saved in Revision History.'
        : lang === 'el'
        ? 'Το κείμενο προστέθηκε στο κεφάλαιο (προηγούμενη εκδοχή στο Ιστορικό).'
        : 'Text inserted into chapter (previous version saved in History).'
    );
    setMobilePane('editor');
  };

  const handleRestoreRevision = (rev: ChapterRevision, mode: 'excerpt' | 'full') => {
    if (!activeChapter) return;

    if (
      mode === 'excerpt' &&
      rev.previousExcerpt &&
      rev.newExcerpt &&
      activeChapter.content.includes(rev.newExcerpt)
    ) {
      const restored = activeChapter.content.replace(rev.newExcerpt, rev.previousExcerpt);
      handleUpdateChapter({ ...activeChapter, content: restored });
      setSelectedExcerpt(rev.previousExcerpt);
      setStudioNotice(
        lang === 'el'
          ? 'Επαναφέρθηκε μόνο η συγκεκριμένη παράγραφος χωρίς να χαθούν οι υπόλοιπες αλλαγές σου!'
          : 'Restored only that specific excerpt while keeping all your other edits!'
      );
      return;
    }

    handleUpdateChapter({ ...activeChapter, content: rev.fullContent });
    setSelectedExcerpt('');
    setStudioNotice(
      lang === 'el'
        ? 'Επαναφέρθηκε ολόκληρο το κεφάλαιο από το στιγμιότυπο.'
        : 'Restored full chapter from snapshot.'
    );
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
    <div className="relative flex h-[calc(100vh-57px)] flex-col overflow-hidden">
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
          className="flex items-center justify-between border-b px-4 py-1.5 text-xs"
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

      {/* Main Studio Layout: 40% Editor (Left) / 60% AI Council & Chat (Right) on desktop */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Mobile Chapters Pane */}
        <div className={`${mobilePane === 'chapters' ? 'block w-full' : 'hidden'} lg:hidden h-full overflow-hidden`}>
          <ChapterBibleSidebar
            lang={lang}
            book={book}
            activeChapterId={activeChapter.id}
            onSelectChapter={(id) => {
              setActiveChapterId(id);
              setSelectedExcerpt('');
              setMobilePane('editor');
            }}
            onAddChapter={handleAddChapter}
            onDeleteChapter={handleDeleteChapter}
            onUpdateBook={onUpdateBook}
          />
        </div>

        {/* Desktop Collapsible Slide-Over Drawer for Chapters & Book Bible */}
        {sidebarOpen && (
          <div className="hidden lg:flex fixed inset-0 top-[57px] z-40">
            <div
              className="relative w-72 h-full shadow-2xl flex flex-col"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            >
              <button
                onClick={() => setSidebarOpen(false)}
                title={lang === 'el' ? 'Κλείσιμο' : 'Close'}
                className="absolute right-2 top-2 z-10 rounded-lg p-1 hover:opacity-80 cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="h-4 w-4" />
              </button>
              <ChapterBibleSidebar
                lang={lang}
                book={book}
                activeChapterId={activeChapter.id}
                onSelectChapter={(id) => {
                  setActiveChapterId(id);
                  setSelectedExcerpt('');
                  setSidebarOpen(false);
                }}
                onAddChapter={handleAddChapter}
                onDeleteChapter={handleDeleteChapter}
                onUpdateBook={onUpdateBook}
              />
            </div>
            <div
              className="flex-1 bg-black/25 backdrop-blur-[1px]"
              onClick={() => setSidebarOpen(false)}
            />
          </div>
        )}

        {/* Editor Column: 40% width on desktop */}
        <div
          className={`${
            mobilePane === 'editor' ? 'block w-full' : 'hidden'
          } lg:block lg:w-[40%] h-full overflow-hidden min-w-0`}
        >
          <ChapterEditor
            lang={lang}
            book={book}
            chapter={activeChapter}
            aiConfig={aiConfig}
            completing={completing}
            checkingRipple={checkingRipple}
            sidebarOpen={sidebarOpen}
            selectedExcerpt={selectedExcerpt}
            onToggleSidebar={() => setSidebarOpen((v) => !v)}
            onSelectExcerpt={setSelectedExcerpt}
            onUpdateChapter={handleUpdateChapter}
            onSaveSnapshot={handleSaveSnapshot}
            onRestoreRevision={handleRestoreRevision}
            onUpdateFont={handleUpdateFont}
            onCompleteChapter={handleCompleteChapter}
            onCheckRipple={handleCheckRipple}
            onOpenSettings={onOpenSettings}
          />
        </div>

        {/* AI Council & Chat Column: 60% width on desktop */}
        <div
          className={`${
            mobilePane === 'ai' ? 'block w-full' : 'hidden'
          } lg:block lg:w-[60%] h-full overflow-hidden min-w-0`}
        >
          <AICouncilPanel
            lang={lang}
            book={book}
            chapter={activeChapter}
            aiConfig={aiConfig}
            selectedExcerpt={selectedExcerpt}
            onUpdateChapter={handleUpdateChapter}
            onApplyText={handleApplyText}
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
