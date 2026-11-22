import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  FileEdit,
  ListChecks,
  Plus,
  Trash2,
} from 'lucide-react';
import { t } from '../../i18n/translations';
import { BibleEntity, Book, Chapter, OpenThread, UILanguage } from '../../types/book';
import { countWords, uid } from '../../utils/bookUtils';

interface ChapterBibleSidebarProps {
  lang: UILanguage;
  book: Book;
  activeChapterId: string;
  onSelectChapter: (chapterId: string) => void;
  onAddChapter: () => void;
  onDeleteChapter: (chapterId: string) => void;
  onUpdateBook: (book: Book) => void;
}

export const ChapterBibleSidebar: React.FC<ChapterBibleSidebarProps> = ({
  lang,
  book,
  activeChapterId,
  onSelectChapter,
  onAddChapter,
  onDeleteChapter,
  onUpdateBook,
}) => {
  const [tab, setTab] = useState<'chapters' | 'bible'>('chapters');
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityDesc, setNewEntityDesc] = useState('');
  const [newEntityCat, setNewEntityCat] = useState<BibleEntity['category']>('character');

  const [newThreadTitle, setNewThreadTitle] = useState('');

  const sortedChapters = [...book.chapters].sort((a, b) => a.number - b.number);

  const handleAddEntity = () => {
    if (!newEntityName.trim()) return;
    const entity: BibleEntity = {
      id: uid('ent'),
      name: newEntityName.trim(),
      category: newEntityCat,
      description: newEntityDesc.trim(),
      currentStatus: '',
    };
    onUpdateBook({
      ...book,
      bible: {
        ...book.bible,
        entities: [entity, ...book.bible.entities],
      },
    });
    setNewEntityName('');
    setNewEntityDesc('');
  };

  const handleDeleteEntity = (id: string) => {
    onUpdateBook({
      ...book,
      bible: {
        ...book.bible,
        entities: book.bible.entities.filter((e) => e.id !== id),
      },
    });
  };

  const handleAddThread = () => {
    if (!newThreadTitle.trim()) return;
    const thread: OpenThread = {
      id: uid('thr'),
      title: newThreadTitle.trim(),
      status: 'open',
      notes: '',
    };
    onUpdateBook({
      ...book,
      bible: {
        ...book.bible,
        openThreads: [thread, ...book.bible.openThreads],
      },
    });
    setNewThreadTitle('');
  };

  const handleToggleThread = (id: string) => {
    onUpdateBook({
      ...book,
      bible: {
        ...book.bible,
        openThreads: book.bible.openThreads.map((th) =>
          th.id === id ? { ...th, status: th.status === 'open' ? 'resolved' : 'open' } : th
        ),
      },
    });
  };

  const getStatusIcon = (status: Chapter['status']) => {
    if (status === 'completed') {
      return <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--sage)' }} />;
    }
    if (status === 'draft') {
      return <FileEdit className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--amber)' }} />;
    }
    return <Circle className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />;
  };

  return (
    <aside
      className="flex h-full flex-col border-r"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Tab Switcher */}
      <div className="flex border-b p-2 gap-1" style={{ borderColor: 'var(--border-subtle)' }}>
        <button
          onClick={() => setTab('chapters')}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-colors cursor-pointer"
          style={{
            backgroundColor: tab === 'chapters' ? 'var(--bg-subtle)' : 'transparent',
            color: tab === 'chapters' ? 'var(--text-primary)' : 'var(--text-muted)',
          }}
        >
          <ListChecks className="h-3.5 w-3.5" />
          <span>{t(lang, 'chaptersTab')}</span>
        </button>
        <button
          onClick={() => setTab('bible')}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-colors cursor-pointer"
          style={{
            backgroundColor: tab === 'bible' ? 'var(--bg-subtle)' : 'transparent',
            color: tab === 'bible' ? 'var(--text-primary)' : 'var(--text-muted)',
          }}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>{t(lang, 'bibleTab')}</span>
        </button>
      </div>

      {/* Chapters Tab */}
      {tab === 'chapters' ? (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
            {sortedChapters.map((ch) => {
              const active = ch.id === activeChapterId;
              const wc = countWords(ch.content);
              return (
                <div
                  key={ch.id}
                  onClick={() => onSelectChapter(ch.id)}
                  className="group flex items-start justify-between gap-2 rounded-xl px-3 py-2.5 transition-colors cursor-pointer"
                  style={{
                    backgroundColor: active ? 'var(--accent-soft)' : 'transparent',
                    color: active ? 'var(--accent)' : 'var(--text-primary)',
                  }}
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="mt-0.5">{getStatusIcon(ch.status)}</span>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold">
                        {ch.number}. {ch.title}
                      </div>
                      <div className="mt-0.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {wc} {t(lang, 'words')} •{' '}
                        {ch.status === 'completed'
                          ? t(lang, 'statusCompleted')
                          : ch.status === 'draft'
                          ? t(lang, 'statusDraft')
                          : t(lang, 'statusPlanned')}
                      </div>
                    </div>
                  </div>
                  {book.chapters.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChapter(ch.id);
                      }}
                      className="opacity-0 group-hover:opacity-70 hover:!opacity-100 p-1 cursor-pointer"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t p-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
            <button
              id="btn-add-chapter"
              onClick={onAddChapter}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-semibold transition-colors cursor-pointer"
              style={{
                borderColor: 'var(--border-strong)',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-canvas)',
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t(lang, 'addChapter')}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Book Bible Tab */
        <div className="flex-1 overflow-y-auto p-3 space-y-5 text-xs">
          {/* Premise */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              {t(lang, 'premiseLabel')}
            </label>
            <textarea
              rows={3}
              value={book.bible.premise}
              onChange={(e) =>
                onUpdateBook({
                  ...book,
                  bible: { ...book.bible, premise: e.target.value },
                })
              }
              className="w-full rounded-lg border p-2 text-xs leading-relaxed outline-none"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Entities */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              {t(lang, 'bibleEntities')} ({book.bible.entities.length})
            </div>

            <div className="space-y-1.5 mb-2.5">
              <div className="flex gap-1">
                <input
                  type="text"
                  value={newEntityName}
                  onChange={(e) => setNewEntityName(e.target.value)}
                  placeholder={lang === 'el' ? 'Όνομα χαρακτήρα / έννοιας' : 'Character / concept name'}
                  className="flex-1 min-w-0 rounded-lg border px-2 py-1 text-xs outline-none"
                  style={{
                    backgroundColor: 'var(--bg-canvas)',
                    borderColor: 'var(--border-subtle)',
                  }}
                />
                <select
                  value={newEntityCat}
                  onChange={(e) => setNewEntityCat(e.target.value as BibleEntity['category'])}
                  className="rounded-lg border px-1.5 py-1 text-[10px] outline-none"
                  style={{
                    backgroundColor: 'var(--bg-canvas)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <option value="character">Char</option>
                  <option value="concept">Concept</option>
                  <option value="location">Place</option>
                  <option value="rule">Rule</option>
                </select>
              </div>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={newEntityDesc}
                  onChange={(e) => setNewEntityDesc(e.target.value)}
                  placeholder={lang === 'el' ? 'Σύντομη περιγραφή...' : 'Short description...'}
                  className="flex-1 min-w-0 rounded-lg border px-2 py-1 text-xs outline-none"
                  style={{
                    backgroundColor: 'var(--bg-canvas)',
                    borderColor: 'var(--border-subtle)',
                  }}
                />
                <button
                  onClick={handleAddEntity}
                  className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-white cursor-pointer"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  +
                </button>
              </div>
            </div>

            {book.bible.entities.length === 0 ? (
              <p className="text-[11px] italic" style={{ color: 'var(--text-muted)' }}>
                {t(lang, 'noEntitiesYet')}
              </p>
            ) : (
              <div className="space-y-2">
                {book.bible.entities.map((ent) => (
                  <div
                    key={ent.id}
                    className="rounded-lg border p-2"
                    style={{
                      backgroundColor: 'var(--bg-canvas)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold">{ent.name}</span>
                      <button
                        onClick={() => handleDeleteEntity(ent.id)}
                        className="opacity-50 hover:opacity-100 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    {ent.description && (
                      <p className="mt-0.5 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                        {ent.description}
                      </p>
                    )}
                    {ent.currentStatus && (
                      <p className="mt-0.5 text-[10px] font-medium" style={{ color: 'var(--sage)' }}>
                        → {ent.currentStatus}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Open Threads */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              {t(lang, 'bibleThreads')} ({book.bible.openThreads.length})
            </div>
            <div className="flex gap-1 mb-2">
              <input
                type="text"
                value={newThreadTitle}
                onChange={(e) => setNewThreadTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddThread()}
                placeholder={lang === 'el' ? 'Πρόσθεσε ανοιχτό νήμα...' : 'Add open thread...'}
                className="flex-1 min-w-0 rounded-lg border px-2 py-1 text-xs outline-none"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-subtle)',
                }}
              />
              <button
                onClick={handleAddThread}
                className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-white cursor-pointer"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                +
              </button>
            </div>
            <div className="space-y-1.5">
              {book.bible.openThreads.map((th) => (
                <div
                  key={th.id}
                  onClick={() => handleToggleThread(th.id)}
                  className="flex items-start gap-2 rounded-lg border p-2 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-canvas)',
                    borderColor: 'var(--border-subtle)',
                    opacity: th.status === 'resolved' ? 0.6 : 1,
                  }}
                >
                  <CheckCircle2
                    className="h-3.5 w-3.5 mt-0.5 shrink-0"
                    style={{
                      color: th.status === 'resolved' ? 'var(--sage)' : 'var(--text-muted)',
                    }}
                  />
                  <div className="min-w-0">
                    <div className={th.status === 'resolved' ? 'line-through' : 'font-medium'}>
                      {th.title}
                    </div>
                    {th.notes && (
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {th.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chapter Summaries */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              {t(lang, 'bibleSummaries')}
            </div>
            <div className="space-y-2">
              {sortedChapters
                .filter((c) => c.summary)
                .map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg border p-2"
                    style={{
                      backgroundColor: 'var(--bg-canvas)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="font-semibold">
                      {c.number}. {c.title}
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {c.summary}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
