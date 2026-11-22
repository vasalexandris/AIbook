import React, { useState } from 'react';
import {
  Compass,
  CornerDownLeft,
  Layers,
  Loader2,
  Send,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import { AI_ROLES, getRoleById, ROLE_GROUPS } from '../../data/roles';
import { t } from '../../i18n/translations';
import { askCouncil, chatWithRole, suggestChapterDirections } from '../../services/ai';
import {
  AIProviderConfig,
  AIRoleGroup,
  AIRoleId,
  Book,
  Chapter,
  ChatMessage,
  CouncilFeedbackItem,
  DirectionScenario,
  UILanguage,
} from '../../types/book';
import { renderMarkdownHtml, uid } from '../../utils/bookUtils';

interface AICouncilPanelProps {
  lang: UILanguage;
  book: Book;
  chapter: Chapter;
  aiConfig: AIProviderConfig;
  onUpdateChapter: (chapter: Chapter) => void;
  onInsertToEditor: (text: string) => void;
  onOpenSettings: () => void;
}

export const AICouncilPanel: React.FC<AICouncilPanelProps> = ({
  lang,
  book,
  chapter,
  aiConfig,
  onUpdateChapter,
  onInsertToEditor,
  onOpenSettings,
}) => {
  const [panelMode, setPanelMode] = useState<'single' | 'council'>('single');
  const [activeGroup, setActiveGroup] = useState<AIRoleGroup>('creation');
  const [activeRole, setActiveRole] = useState<AIRoleId>('coauthor');

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Direction scenarios
  const [scenarios, setScenarios] = useState<DirectionScenario[]>([]);
  const [loadingScenarios, setLoadingScenarios] = useState(false);

  // Multi-role Council mode
  const [councilRoles, setCouncilRoles] = useState<AIRoleId[]>(['editor', 'reader', 'publisher']);
  const [councilQuestion, setCouncilQuestion] = useState('');
  const [councilResults, setCouncilResults] = useState<CouncilFeedbackItem[]>([]);
  const [loadingCouncil, setLoadingCouncil] = useState(false);

  const currentRoleDef = getRoleById(activeRole);
  const priorSummariesCount = book.chapters.filter(
    (c) => c.number < chapter.number && (c.summary || c.outline)
  ).length;

  const handleSendSingle = async (customText?: string) => {
    if (!aiConfig.apiKey) {
      onOpenSettings();
      return;
    }
    const text = (customText ?? input).trim();
    if (!text) return;

    setError(null);
    setLoading(true);
    if (!customText) setInput('');

    const userMsg: ChatMessage = {
      id: uid('msg'),
      role: 'user',
      aiPersona: activeRole,
      content: text,
      timestamp: new Date().toISOString(),
    };

    const nextHistory = [...chapter.chatHistory, userMsg];
    onUpdateChapter({ ...chapter, chatHistory: nextHistory });

    try {
      const reply = await chatWithRole(
        aiConfig,
        book,
        chapter,
        activeRole,
        text,
        chapter.chatHistory
      );
      const aiMsg: ChatMessage = {
        id: uid('msg'),
        role: 'assistant',
        aiPersona: activeRole,
        content: reply,
        timestamp: new Date().toISOString(),
      };
      onUpdateChapter({ ...chapter, chatHistory: [...nextHistory, aiMsg] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestDirections = async () => {
    if (!aiConfig.apiKey) {
      onOpenSettings();
      return;
    }
    setError(null);
    setLoadingScenarios(true);
    try {
      const list = await suggestChapterDirections(aiConfig, book, chapter);
      setScenarios(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate directions');
    } finally {
      setLoadingScenarios(false);
    }
  };

  const handlePickScenario = (sc: DirectionScenario) => {
    setScenarios([]);
    setActiveGroup('creation');
    setActiveRole('coauthor');
    const prompt =
      lang === 'el'
        ? `Επιλέγω την κατεύθυνση «${sc.title}» (${sc.description}). Γράψε το επόμενο τμήμα του κεφαλαίου ακολουθώντας αυτή την κατεύθυνση, με το ύφος του βιβλίου.`
        : `I choose the direction "${sc.title}" (${sc.description}). Draft the next section of this chapter following this direction in the book's voice.`;
    handleSendSingle(prompt);
  };

  const toggleCouncilRole = (id: AIRoleId) => {
    setCouncilRoles((prev) => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter((r) => r !== id) : prev;
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  const handleRunCouncil = async () => {
    if (!aiConfig.apiKey) {
      onOpenSettings();
      return;
    }
    const q =
      councilQuestion.trim() ||
      (lang === 'el'
        ? 'Αξιολόγησε το τρέχον κεφάλαιο από τη δική σου οπτική και δώσε 2-3 συγκεκριμένες προτάσεις βελτίωσης.'
        : 'Evaluate the current chapter from your specific perspective and give 2–3 concrete suggestions.');

    setError(null);
    setLoadingCouncil(true);
    try {
      const res = await askCouncil(aiConfig, book, chapter, councilRoles, q);
      setCouncilResults(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Council error');
    } finally {
      setLoadingCouncil(false);
    }
  };

  return (
    <aside
      className="flex h-full flex-col border-l overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Top Mode Switcher + Fresh Context Indicator */}
      <div className="border-b p-2.5 space-y-2" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex gap-1">
          <button
            onClick={() => setPanelMode('single')}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-colors cursor-pointer"
            style={{
              backgroundColor: panelMode === 'single' ? 'var(--bg-subtle)' : 'transparent',
              color: panelMode === 'single' ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t(lang, 'singleRoleMode')}</span>
          </button>
          <button
            id="btn-mode-council"
            onClick={() => setPanelMode('council')}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-colors cursor-pointer"
            style={{
              backgroundColor: panelMode === 'council' ? 'var(--bg-subtle)' : 'transparent',
              color: panelMode === 'council' ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            <Users className="h-3.5 w-3.5" />
            <span>{t(lang, 'councilMode')}</span>
          </button>
        </div>

        {/* Fresh Context Window Pill */}
        <div
          title={t(lang, 'contextTooltip')}
          className="flex items-center justify-between rounded-lg px-2.5 py-1 text-[10px]"
          style={{
            backgroundColor: 'var(--sage-soft)',
            color: 'var(--sage)',
          }}
        >
          <span className="inline-flex items-center gap-1 font-semibold">
            <Layers className="h-3 w-3" />
            {t(lang, 'freshContextBadge')} #{chapter.number}
          </span>
          <span>
            Bible ({book.bible.entities.length}) • Prev ({priorSummariesCount}) • Ref (
            {book.bible.researchItems.length})
          </span>
        </div>
      </div>

      {error && (
        <div
          className="mx-3 mt-2 rounded-lg border p-2 text-[11px]"
          style={{
            backgroundColor: 'var(--danger-soft)',
            borderColor: 'var(--danger)',
            color: 'var(--danger)',
          }}
        >
          {error}
        </div>
      )}

      {/* SINGLE ROLE MODE */}
      {panelMode === 'single' ? (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Grouped Role Selector */}
          <div className="border-b p-2.5 space-y-2" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex gap-1">
              {ROLE_GROUPS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    setActiveGroup(g.id);
                    const firstInGroup = AI_ROLES.find((r) => r.group === g.id);
                    if (firstInGroup) setActiveRole(firstInGroup.id);
                  }}
                  className="flex-1 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors cursor-pointer"
                  style={{
                    backgroundColor: activeGroup === g.id ? 'var(--accent-soft)' : 'var(--bg-canvas)',
                    color: activeGroup === g.id ? 'var(--accent)' : 'var(--text-muted)',
                  }}
                >
                  {lang === 'el' ? g.nameEl : g.nameEn}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {AI_ROLES.filter((r) => r.group === activeGroup).map((role) => {
                const selected = role.id === activeRole;
                return (
                  <button
                    key={role.id}
                    onClick={() => setActiveRole(role.id)}
                    className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer"
                    style={{
                      borderColor: selected ? 'var(--accent)' : 'var(--border-subtle)',
                      backgroundColor: selected ? 'var(--accent)' : 'var(--bg-canvas)',
                      color: selected ? '#ffffff' : 'var(--text-secondary)',
                    }}
                  >
                    {lang === 'el' ? role.nameEl : role.nameEn}
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] leading-snug" style={{ color: 'var(--text-muted)' }}>
              {lang === 'el' ? currentRoleDef.shortDescEl : currentRoleDef.shortDescEn}
            </p>

            {/* Quick Collaboration Actions */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                id="btn-suggest-directions"
                onClick={handleSuggestDirections}
                disabled={loadingScenarios}
                className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                style={{
                  borderColor: 'var(--accent)',
                  color: 'var(--accent)',
                  backgroundColor: 'var(--accent-soft)',
                }}
              >
                {loadingScenarios ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Compass className="h-3 w-3" />
                )}
                <span>{t(lang, 'suggestDirectionsBtn')}</span>
              </button>

              {(lang === 'el' ? currentRoleDef.quickPromptsEl : currentRoleDef.quickPromptsEn)
                .slice(0, 1)
                .map((qp, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendSingle(qp)}
                    disabled={loading}
                    className="truncate max-w-full rounded-lg border px-2.5 py-1 text-[11px] cursor-pointer disabled:opacity-50"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      backgroundColor: 'var(--bg-canvas)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {qp}
                  </button>
                ))}
            </div>
          </div>

          {/* Direction Scenarios Cards (if generated) */}
          {scenarios.length > 0 && (
            <div
              className="border-b p-3 space-y-2 max-h-60 overflow-y-auto"
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                {lang === 'el' ? 'Επίλεξε κατεύθυνση για συνέχεια:' : 'Choose a direction to continue:'}
              </div>
              {scenarios.map((sc, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePickScenario(sc)}
                  className="block w-full rounded-xl border p-2.5 text-left transition-colors hover:opacity-95 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-strong)',
                  }}
                >
                  <div className="text-xs font-semibold">{sc.title}</div>
                  <p className="mt-0.5 text-[11px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
                    {sc.description}
                  </p>
                  <div className="mt-1 text-[10px] italic" style={{ color: 'var(--sage)' }}>
                    {sc.toneImpact}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Chat Feed */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {chapter.chatHistory.length === 0 ? (
              <div className="py-8 text-center text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {lang === 'el'
                  ? `Συνεργάσου με τον ρόλο «${currentRoleDef.nameEl}» για το Κεφάλαιο ${chapter.number}. Κάθε κεφάλαιο ξεκινά με καθαρό context window και πλήρη γνώση της Βίβλου.`
                  : `Collaborate with "${currentRoleDef.nameEn}" on Chapter ${chapter.number}. Each chapter runs in a fresh context window fed by your Book Bible.`}
              </div>
            ) : (
              chapter.chatHistory.map((msg) => {
                const persona = msg.aiPersona ? getRoleById(msg.aiPersona) : null;
                return (
                  <div
                    key={msg.id}
                    className={`rounded-xl p-3 text-xs ${
                      msg.role === 'user' ? 'ml-6' : 'mr-2 border'
                    }`}
                    style={{
                      backgroundColor:
                        msg.role === 'user' ? 'var(--bg-subtle)' : 'var(--bg-canvas)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wide"
                        style={{
                          color: msg.role === 'user' ? 'var(--text-muted)' : 'var(--accent)',
                        }}
                      >
                        {msg.role === 'user'
                          ? lang === 'el'
                            ? 'Εσύ'
                            : 'You'
                          : persona
                          ? lang === 'el'
                            ? persona.nameEl
                            : persona.nameEn
                          : 'AI'}
                      </span>
                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => onInsertToEditor(msg.content)}
                          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold cursor-pointer"
                          style={{
                            backgroundColor: 'var(--sage-soft)',
                            color: 'var(--sage)',
                          }}
                        >
                          <CornerDownLeft className="h-2.5 w-2.5" />
                          <span>{t(lang, 'insertToEditor')}</span>
                        </button>
                      )}
                    </div>
                    <div
                      className="book-prose text-xs"
                      dangerouslySetInnerHTML={{ __html: renderMarkdownHtml(msg.content) }}
                    />
                  </div>
                );
              })
            )}
            {loading && (
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{lang === 'el' ? 'Η ΑΙ απαντά...' : 'AI is responding...'}</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="border-t p-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
            {chapter.chatHistory.length > 0 && (
              <div className="mb-1.5 flex justify-end">
                <button
                  onClick={() => onUpdateChapter({ ...chapter, chatHistory: [] })}
                  className="inline-flex items-center gap-1 text-[10px] cursor-pointer hover:underline"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Trash2 className="h-3 w-3" />
                  <span>{t(lang, 'clearChapterChat')}</span>
                </button>
              </div>
            )}
            <div className="flex items-end gap-1.5">
              <textarea
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendSingle();
                  }
                }}
                placeholder={t(lang, 'askPlaceholder')}
                className="flex-1 resize-none rounded-xl border px-3 py-2 text-xs outline-none"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                id="btn-send-ai-chat"
                onClick={() => handleSendSingle()}
                disabled={loading || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* MULTI-ROLE COUNCIL MODE */
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b p-3 space-y-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
              {t(lang, 'selectRolesHint')} ({councilRoles.length}/3)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {AI_ROLES.map((r) => {
                const active = councilRoles.includes(r.id);
                return (
                  <button
                    key={r.id}
                    onClick={() => toggleCouncilRole(r.id)}
                    className="rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors cursor-pointer"
                    style={{
                      borderColor: active ? 'var(--accent)' : 'var(--border-subtle)',
                      backgroundColor: active ? 'var(--accent)' : 'var(--bg-canvas)',
                      color: active ? '#ffffff' : 'var(--text-secondary)',
                    }}
                  >
                    {lang === 'el' ? r.nameEl : r.nameEn}
                  </button>
                );
              })}
            </div>

            <textarea
              rows={2}
              value={councilQuestion}
              onChange={(e) => setCouncilQuestion(e.target.value)}
              placeholder={t(lang, 'councilPlaceholder')}
              className="w-full resize-none rounded-xl border px-3 py-2 text-xs outline-none"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                borderColor: 'var(--border-strong)',
              }}
            />

            <button
              id="btn-run-council"
              onClick={handleRunCouncil}
              disabled={loadingCouncil}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-white disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {loadingCouncil ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Users className="h-3.5 w-3.5" />
              )}
              <span>{t(lang, 'askCouncilRun')}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {councilResults.length === 0 ? (
              <div className="py-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                {lang === 'el'
                  ? 'Επίλεξε 2–3 ρόλους (π.χ. Επιμελητής + Αναγνώστης + Εκδότης) για να ακούσεις ταυτόχρονα διαφορετικές οπτικές.'
                  : 'Select 2–3 roles (e.g. Editor + Reader + Publisher) to hear simultaneous multi-perspective feedback.'}
              </div>
            ) : (
              councilResults.map((item) => {
                const role = getRoleById(item.roleId);
                return (
                  <div
                    key={item.roleId}
                    className="rounded-xl border p-3"
                    style={{
                      backgroundColor: 'var(--bg-canvas)',
                      borderColor: 'var(--border-strong)',
                    }}
                  >
                    <div className="mb-1.5 text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                      {lang === 'el' ? role.nameEl : role.nameEn}
                    </div>
                    {item.error ? (
                      <div className="text-xs" style={{ color: 'var(--danger)' }}>
                        {item.error}
                      </div>
                    ) : (
                      <div
                        className="book-prose text-xs"
                        dangerouslySetInnerHTML={{ __html: renderMarkdownHtml(item.feedback) }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
