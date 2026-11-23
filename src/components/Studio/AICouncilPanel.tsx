import React, { useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Compass,
  Copy,
  CornerDownLeft,
  Layers,
  Loader2,
  Replace,
  Send,
  Sparkles,
  Trash2,
  Users,
  X,
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
import { countWords, renderMarkdownHtml, uid } from '../../utils/bookUtils';

interface AICouncilPanelProps {
  lang: UILanguage;
  book: Book;
  chapter: Chapter;
  aiConfig: AIProviderConfig;
  selectedExcerpt: string;
  onUpdateChapter: (chapter: Chapter) => void;
  onApplyText: (text: string, mode: 'replace' | 'append', label: string) => void;
  onOpenSettings: () => void;
}

interface ParsedSegment {
  type: 'markdown' | 'apply';
  title?: string;
  content: string;
}

/**
 * Splits an AI response into normal prose segments and ```apply:Title ... ``` blocks
 * so each alternative or corrected version gets its own 1-click Apply/Replace card!
 */
function parseApplyBlocks(raw: string): ParsedSegment[] {
  const regex = /```apply(?::([^\n]*))?\n([\s\S]*?)```/g;
  const segments: ParsedSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      const before = raw.slice(lastIndex, match.index).trim();
      if (before) segments.push({ type: 'markdown', content: before });
    }
    segments.push({
      type: 'apply',
      title: match[1]?.trim() || undefined,
      content: match[2].trim(),
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < raw.length) {
    const rest = raw.slice(lastIndex).trim();
    if (rest) segments.push({ type: 'markdown', content: rest });
  }

  return segments.length > 0 ? segments : [{ type: 'markdown', content: raw }];
}

export const AICouncilPanel: React.FC<AICouncilPanelProps> = ({
  lang,
  book,
  chapter,
  aiConfig,
  selectedExcerpt,
  onUpdateChapter,
  onApplyText,
  onOpenSettings,
}) => {
  const [panelMode, setPanelMode] = useState<'single' | 'council'>('single');
  const [activeGroup, setActiveGroup] = useState<AIRoleGroup>('creation');
  const [activeRole, setActiveRole] = useState<AIRoleId>('coauthor');

  // Collapsible controls so chat & reading space can expand generously!
  const [rolesExpanded, setRolesExpanded] = useState(true);
  const [actionsExpanded, setActionsExpanded] = useState(true);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Collapsible Direction Scenarios
  const [scenarios, setScenarios] = useState<DirectionScenario[]>([]);
  const [scenariosOpen, setScenariosOpen] = useState(true);
  const [loadingScenarios, setLoadingScenarios] = useState(false);

  // Multi-role Council mode
  const [councilRoles, setCouncilRoles] = useState<AIRoleId[]>(['editor', 'reader', 'publisher']);
  const [councilQuestion, setCouncilQuestion] = useState('');
  const [councilResults, setCouncilResults] = useState<CouncilFeedbackItem[]>([]);
  const [loadingCouncil, setLoadingCouncil] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const currentRoleDef = getRoleById(activeRole);
  const priorSummariesCount = book.chapters.filter(
    (c) => c.number < chapter.number && (c.summary || c.outline)
  ).length;

  const activeQuickActions =
    currentRoleDef.quickActions && currentRoleDef.quickActions.length > 0
      ? currentRoleDef.quickActions
      : (lang === 'el' ? currentRoleDef.quickPromptsEl : currentRoleDef.quickPromptsEn).map(
          (p) => ({
            labelEl: p.length > 48 ? `${p.slice(0, 48)}…` : p,
            labelEn: p.length > 48 ? `${p.slice(0, 48)}…` : p,
            promptEl: p,
            promptEn: p,
          })
        );

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1600);
  };

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
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);

    try {
      const reply = await chatWithRole(
        aiConfig,
        book,
        chapter,
        activeRole,
        text,
        chapter.chatHistory,
        selectedExcerpt
      );
      const aiMsg: ChatMessage = {
        id: uid('msg'),
        role: 'assistant',
        aiPersona: activeRole,
        content: reply,
        timestamp: new Date().toISOString(),
      };
      onUpdateChapter({ ...chapter, chatHistory: [...nextHistory, aiMsg] });
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
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
      setScenariosOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate directions');
    } finally {
      setLoadingScenarios(false);
    }
  };

  const handlePickScenario = (sc: DirectionScenario) => {
    setScenariosOpen(false);
    setActiveGroup('creation');
    setActiveRole('coauthor');
    const prompt =
      lang === 'el'
        ? `Επιλέγω την κατεύθυνση «${sc.title}» (${sc.description}). Γράψε το επόμενο τμήμα του κεφαλαίου ακολουθώντας αυτή την κατεύθυνση με το ύφος του βιβλίου και δώσε το έτοιμο κείμενο σε μπλοκ εφαρμογής.`
        : `I choose the direction "${sc.title}" (${sc.description}). Draft the next section following this direction in the book's voice and wrap the ready text in an apply block.`;
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
      {/* Compact Top Bar: Mode Switcher + Fresh Context + Collapse Roles Toggle */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div
          className="flex rounded-lg p-0.5 gap-0.5"
          style={{ backgroundColor: 'var(--bg-subtle)' }}
        >
          <button
            onClick={() => setPanelMode('single')}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer"
            style={{
              backgroundColor: panelMode === 'single' ? 'var(--bg-surface)' : 'transparent',
              color: panelMode === 'single' ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t(lang, 'singleRoleMode')}</span>
          </button>
          <button
            id="btn-mode-council"
            onClick={() => setPanelMode('council')}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer"
            style={{
              backgroundColor: panelMode === 'council' ? 'var(--bg-surface)' : 'transparent',
              color: panelMode === 'council' ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            <Users className="h-3.5 w-3.5" />
            <span>{t(lang, 'councilMode')}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span
            title={t(lang, 'contextTooltip')}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium"
            style={{
              backgroundColor: 'var(--sage-soft)',
              color: 'var(--sage)',
            }}
          >
            <Layers className="h-3 w-3" />
            <span>
              #{chapter.number} • Bible ({book.bible.entities.length}) • Prev ({priorSummariesCount})
            </span>
          </span>

          {panelMode === 'single' && (
            <button
              onClick={() => setRolesExpanded((v) => !v)}
              title={lang === 'el' ? 'Εμφάνιση/Απόκρυψη Ρόλων' : 'Toggle Roles Panel'}
              className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold cursor-pointer"
              style={{
                borderColor: 'var(--border-strong)',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-canvas)',
              }}
            >
              <span>{lang === 'el' ? currentRoleDef.nameEl : currentRoleDef.nameEn}</span>
              {rolesExpanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div
          className="mx-3 mt-2 rounded-lg border p-2.5 text-xs"
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
          {/* Collapsible Roles & Quick Actions Tray */}
          {rolesExpanded && (
            <div
              className="border-b px-3.5 py-2.5 space-y-2"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              {/* Role Group Tabs */}
              <div className="flex items-center gap-1.5">
                {ROLE_GROUPS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      setActiveGroup(g.id);
                      const firstInGroup = AI_ROLES.find((r) => r.group === g.id);
                      if (firstInGroup) setActiveRole(firstInGroup.id);
                    }}
                    className="flex-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer"
                    style={{
                      backgroundColor:
                        activeGroup === g.id ? 'var(--accent-soft)' : 'var(--bg-surface)',
                      color: activeGroup === g.id ? 'var(--accent)' : 'var(--text-muted)',
                    }}
                  >
                    {lang === 'el' ? g.nameEl : g.nameEn}
                  </button>
                ))}
              </div>

              {/* Role Pills */}
              <div className="flex flex-wrap gap-1.5">
                {AI_ROLES.filter((r) => r.group === activeGroup).map((role) => {
                  const selected = role.id === activeRole;
                  return (
                    <button
                      key={role.id}
                      onClick={() => setActiveRole(role.id)}
                      className="rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer"
                      style={{
                        borderColor: selected ? 'var(--accent)' : 'var(--border-subtle)',
                        backgroundColor: selected ? 'var(--accent)' : 'var(--bg-surface)',
                        color: selected ? '#ffffff' : 'var(--text-secondary)',
                      }}
                    >
                      {lang === 'el' ? role.nameEl : role.nameEn}
                    </button>
                  );
                })}
              </div>

              {/* Collapsible Ready-Made Role Actions Box */}
              <div
                className="rounded-xl border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setActionsExpanded((v) => !v)}
                  className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs font-semibold cursor-pointer"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <span>
                    {lang === 'el'
                      ? `Έτοιμες επιλογές: ${currentRoleDef.nameEl}`
                      : `Quick Actions: ${currentRoleDef.nameEn}`}
                  </span>
                  {actionsExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>

                {actionsExpanded && (
                  <div
                    className="flex flex-wrap gap-1.5 border-t px-3 py-2"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    {activeQuickActions.map((act, i) => (
                      <button
                        key={i}
                        type="button"
                        disabled={loading}
                        onClick={() =>
                          handleSendSingle(lang === 'el' ? act.promptEl : act.promptEn)
                        }
                        className="rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors hover:opacity-90 disabled:opacity-50 cursor-pointer"
                        style={{
                          borderColor: 'var(--border-strong)',
                          backgroundColor: 'var(--bg-canvas)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {lang === 'el' ? act.labelEl : act.labelEn}
                      </button>
                    ))}

                    <button
                      id="btn-suggest-directions"
                      type="button"
                      onClick={handleSuggestDirections}
                      disabled={loadingScenarios}
                      className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50"
                      style={{
                        borderColor: 'var(--accent)',
                        color: 'var(--accent)',
                        backgroundColor: 'var(--accent-soft)',
                      }}
                    >
                      {loadingScenarios ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Compass className="h-3.5 w-3.5" />
                      )}
                      <span>{t(lang, 'suggestDirectionsBtn')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Collapsible 3 Scenarios Tray (can fold/unfold or dismiss anytime!) */}
          {scenarios.length > 0 && (
            <div
              className="border-b"
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderColor: 'var(--border-strong)',
              }}
            >
              <div className="flex items-center justify-between px-3.5 py-1.5">
                <button
                  onClick={() => setScenariosOpen((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                  style={{ color: 'var(--accent)' }}
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>
                    {lang === 'el'
                      ? `3 Προτεινόμενα Σενάρια (${scenariosOpen ? 'Δίπλωση' : 'Άνοιγμα'})`
                      : `3 Suggested Scenarios (${scenariosOpen ? 'Fold' : 'Unfold'})`}
                  </span>
                  {scenariosOpen ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  onClick={() => setScenarios([])}
                  title={lang === 'el' ? 'Κλείσιμο σεναρίων' : 'Dismiss scenarios'}
                  className="p-1 opacity-70 hover:opacity-100 cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {scenariosOpen && (
                <div className="max-h-56 overflow-y-auto px-3.5 pb-3 grid gap-2 sm:grid-cols-3">
                  {scenarios.map((sc, idx) => (
                    <button
                      key={idx}
                      onClick={() => handlePickScenario(sc)}
                      className="flex flex-col justify-between rounded-xl border p-3 text-left transition-all hover:opacity-95 cursor-pointer"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-strong)',
                      }}
                    >
                      <div>
                        <div className="text-xs font-semibold">{sc.title}</div>
                        <p
                          className="mt-1 text-xs leading-snug"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {sc.description}
                        </p>
                      </div>
                      <div className="mt-2 text-[11px] italic" style={{ color: 'var(--sage)' }}>
                        {sc.toneImpact}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Spacious, Readable Chat Feed */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {chapter.chatHistory.length === 0 ? (
              <div
                className="py-10 text-center text-sm leading-relaxed max-w-md mx-auto"
                style={{ color: 'var(--text-muted)' }}
              >
                {lang === 'el'
                  ? `Συνεργάσου με τον ρόλο «${currentRoleDef.nameEl}» για το Κεφάλαιο ${chapter.number}. Μπορείς να πατήσεις μια έτοιμη επιλογή πάνω (π.χ. Ορθογραφικός Έλεγχος) ή να γράψεις ελεύθερα κάτω.`
                  : `Collaborate with "${currentRoleDef.nameEn}" on Chapter ${chapter.number}. Click a quick action above (e.g. Spellcheck) or type freely below.`}
              </div>
            ) : (
              chapter.chatHistory.map((msg) => {
                const persona = msg.aiPersona ? getRoleById(msg.aiPersona) : null;
                const segments =
                  msg.role === 'assistant'
                    ? parseApplyBlocks(msg.content)
                    : [{ type: 'markdown' as const, content: msg.content }];
                const hasApplyBlocks = segments.some((s) => s.type === 'apply');

                return (
                  <div
                    key={msg.id}
                    className={`rounded-2xl p-4 text-sm ${
                      msg.role === 'user' ? 'ml-10 border' : 'border'
                    }`}
                    style={{
                      backgroundColor:
                        msg.role === 'user' ? 'var(--bg-subtle)' : 'var(--bg-canvas)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span
                        className="text-xs font-semibold uppercase tracking-wide"
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

                      {msg.role === 'assistant' && !hasApplyBlocks && (
                        <div className="flex items-center gap-1.5">
                          {selectedExcerpt && (
                            <button
                              onClick={() =>
                                onApplyText(
                                  msg.content,
                                  'replace',
                                  persona
                                    ? lang === 'el'
                                      ? persona.nameEl
                                      : persona.nameEn
                                    : 'AI'
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-white cursor-pointer"
                              style={{ backgroundColor: 'var(--accent)' }}
                            >
                              <Replace className="h-3 w-3" />
                              <span>
                                {lang === 'el' ? 'Αντικατάσταση επιλεγμένου' : 'Replace selection'}
                              </span>
                            </button>
                          )}
                          <button
                            onClick={() =>
                              onApplyText(
                                msg.content,
                                'append',
                                persona
                                  ? lang === 'el'
                                    ? persona.nameEl
                                    : persona.nameEn
                                  : 'AI'
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer"
                            style={{
                              backgroundColor: 'var(--sage-soft)',
                              color: 'var(--sage)',
                            }}
                          >
                            <CornerDownLeft className="h-3 w-3" />
                            <span>{t(lang, 'insertToEditor')}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {segments.map((seg, sIdx) =>
                        seg.type === 'markdown' ? (
                          <div
                            key={sIdx}
                            className="book-prose text-sm leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: renderMarkdownHtml(seg.content),
                            }}
                          />
                        ) : (
                          /* Dedicated 1-Click Ready-to-Apply Proposal Card! */
                          <div
                            key={sIdx}
                            className="rounded-xl border p-3.5 space-y-2.5"
                            style={{
                              backgroundColor: 'var(--bg-surface)',
                              borderColor: 'var(--sage)',
                            }}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2" style={{ borderColor: 'var(--border-subtle)' }}>
                              <span
                                className="text-xs font-semibold"
                                style={{ color: 'var(--sage)' }}
                              >
                                {seg.title ||
                                  (lang === 'el' ? 'Έτοιμη Πρόταση Κειμένου' : 'Ready-to-Apply Text')}
                              </span>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                  onClick={() => handleCopy(`${msg.id}-${sIdx}`, seg.content)}
                                  className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium cursor-pointer"
                                  style={{
                                    borderColor: 'var(--border-strong)',
                                    color: 'var(--text-secondary)',
                                  }}
                                >
                                  {copiedKey === `${msg.id}-${sIdx}` ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                  <span>
                                    {copiedKey === `${msg.id}-${sIdx}`
                                      ? t(lang, 'copied')
                                      : lang === 'el'
                                      ? 'Αντιγραφή'
                                      : 'Copy'}
                                  </span>
                                </button>

                                {selectedExcerpt && (
                                  <button
                                    onClick={() =>
                                      onApplyText(
                                        seg.content,
                                        'replace',
                                        seg.title ||
                                          (lang === 'el' ? 'Επιλεγμένη πρόταση' : 'Selected option')
                                      )
                                    }
                                    className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold text-white cursor-pointer"
                                    style={{ backgroundColor: 'var(--accent)' }}
                                  >
                                    <Replace className="h-3 w-3" />
                                    <span>
                                      {lang === 'el'
                                        ? 'Αντικατάσταση επιλεγμένου'
                                        : 'Replace Selection'}
                                    </span>
                                  </button>
                                )}

                                <button
                                  onClick={() =>
                                    onApplyText(
                                      seg.content,
                                      'append',
                                      seg.title ||
                                        (lang === 'el' ? 'Εισαγωγή πρότασης' : 'Inserted option')
                                    )
                                  }
                                  className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold text-white cursor-pointer"
                                  style={{ backgroundColor: 'var(--sage)' }}
                                >
                                  <CornerDownLeft className="h-3 w-3" />
                                  <span>
                                    {lang === 'el' ? 'Εισαγωγή στο τέλος' : 'Insert at End'}
                                  </span>
                                </button>
                              </div>
                            </div>
                            <div className="text-sm leading-relaxed whitespace-pre-wrap">
                              {seg.content}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {loading && (
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{lang === 'el' ? 'Η ΑΙ επεξεργάζεται το κείμενο...' : 'AI is responding...'}</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Spacious Prompt Input Box */}
          <div
            className="border-t p-3 space-y-2"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center justify-between text-[11px]">
              <span style={{ color: selectedExcerpt ? 'var(--accent)' : 'var(--text-muted)' }}>
                {selectedExcerpt
                  ? lang === 'el'
                    ? `Εστίαση σε επιλεγμένο κείμενο (${countWords(selectedExcerpt)} λέξεις)`
                    : `Focused on selection (${countWords(selectedExcerpt)} words)`
                  : lang === 'el'
                  ? `Συνομιλία με: ${currentRoleDef.nameEl}`
                  : `Chatting with: ${currentRoleDef.nameEn}`}
              </span>
              {chapter.chatHistory.length > 0 && (
                <button
                  onClick={() => onUpdateChapter({ ...chapter, chatHistory: [] })}
                  className="inline-flex items-center gap-1 cursor-pointer hover:underline"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Trash2 className="h-3 w-3" />
                  <span>{t(lang, 'clearChapterChat')}</span>
                </button>
              )}
            </div>

            <div className="flex items-end gap-2">
              <textarea
                rows={3}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendSingle();
                  }
                }}
                placeholder={t(lang, 'askPlaceholder')}
                className="flex-1 resize-y min-h-[76px] max-h-48 rounded-xl border px-3.5 py-2.5 text-sm leading-relaxed outline-none"
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
                className="flex h-11 px-4 shrink-0 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold text-white disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">{lang === 'el' ? 'Αποστολή' : 'Send'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* MULTI-ROLE COUNCIL MODE */
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b p-3.5 space-y-3" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              {t(lang, 'selectRolesHint')} ({councilRoles.length}/3)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {AI_ROLES.map((r) => {
                const active = councilRoles.includes(r.id);
                return (
                  <button
                    key={r.id}
                    onClick={() => toggleCouncilRole(r.id)}
                    className="rounded-full border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer"
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
              rows={3}
              value={councilQuestion}
              onChange={(e) => setCouncilQuestion(e.target.value)}
              placeholder={t(lang, 'councilPlaceholder')}
              className="w-full resize-y rounded-xl border px-3.5 py-2.5 text-sm outline-none"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                borderColor: 'var(--border-strong)',
              }}
            />

            <button
              id="btn-run-council"
              onClick={handleRunCouncil}
              disabled={loadingCouncil}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-white disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {loadingCouncil ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              <span>{t(lang, 'askCouncilRun')}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {councilResults.length === 0 ? (
              <div className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
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
                    className="rounded-2xl border p-4"
                    style={{
                      backgroundColor: 'var(--bg-canvas)',
                      borderColor: 'var(--border-strong)',
                    }}
                  >
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>
                      {lang === 'el' ? role.nameEl : role.nameEn}
                    </div>
                    {item.error ? (
                      <div className="text-xs" style={{ color: 'var(--danger)' }}>
                        {item.error}
                      </div>
                    ) : (
                      <div
                        className="book-prose text-sm leading-relaxed"
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
