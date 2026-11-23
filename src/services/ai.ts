import { getRoleById } from '../data/roles';
import {
  AIProviderConfig,
  AIRoleId,
  Book,
  Chapter,
  ChatMessage,
  CouncilFeedbackItem,
  DirectionScenario,
  DistributionPlan,
  ResearchItem,
  RippleAnalysisResult,
} from '../types/book';

export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

export const GEMINI_MODELS = [
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash (Recommended — Fast & Latest)' },
  { id: 'gemini-3.8-pro', label: 'Gemini 3.8 Pro (Deep reasoning & literary nuance)' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
];

export async function listAvailableGeminiModels(
  apiKey: string
): Promise<{ id: string; label: string }[]> {
  if (!apiKey.trim()) {
    throw new Error('Missing Gemini API Key.');
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
    apiKey.trim()
  )}`;
  const res = await fetch(url);
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      detail = err?.error?.message || detail;
    } catch {
      // ignore
    }
    throw new Error(`Gemini API Error: ${detail}`);
  }
  const data = await res.json();
  const models = Array.isArray(data.models) ? data.models : [];
  return models
    .filter(
      (m: { name?: string; supportedGenerationMethods?: string[] }) =>
        m.name &&
        Array.isArray(m.supportedGenerationMethods) &&
        m.supportedGenerationMethods.includes('generateContent') &&
        m.name.includes('gemini')
    )
    .map((m: { name: string; displayName?: string }) => {
      const id = m.name.replace(/^models\//, '');
      return {
        id,
        label: m.displayName ? `${m.displayName} (${id})` : id,
      };
    });
}

interface GeminiContent {
  role: 'user' | 'model';
  parts: { text: string }[];
}

async function callGeminiRaw(
  config: AIProviderConfig,
  systemInstruction: string,
  contents: GeminiContent[],
  jsonMode = false
): Promise<string> {
  if (!config.apiKey.trim()) {
    throw new Error('Missing Gemini API Key. Please configure it in AI Settings.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    config.model
  )}:generateContent?key=${encodeURIComponent(config.apiKey.trim())}`;

  const body: Record<string, unknown> = {
    system_instruction: {
      parts: [{ text: systemInstruction }],
    },
    contents,
    generationConfig: {
      temperature: jsonMode ? 0.35 : 0.78,
      ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      detail = errJson?.error?.message || detail;
    } catch {
      // ignore
    }
    throw new Error(`Gemini API Error: ${detail}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text || '')
    .join('')
    .trim();

  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }
  return text;
}

function safeParseJSON<T>(raw: string): T {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  return JSON.parse(cleaned) as T;
}

/**
 * Builds a fresh, structured context window for the active chapter.
 * Passes Book Bible + previous chapter summaries + ending of previous chapter + saved research.
 */
export function buildChapterContextPrompt(book: Book, chapter: Chapter): string {
  const prevChapters = book.chapters
    .filter((c) => c.number < chapter.number)
    .sort((a, b) => a.number - b.number);

  const prevSummaries = prevChapters
    .map(
      (c) =>
        `- Chapter ${c.number} ("${c.title}"): ${
          c.summary || c.outline || '(No summary yet)'
        }`
    )
    .join('\n');

  const immediatePrev = prevChapters[prevChapters.length - 1];
  const immediatePrevTail = immediatePrev?.content
    ? immediatePrev.content.slice(-1400)
    : '';

  const entitiesText =
    book.bible.entities.length > 0
      ? book.bible.entities
          .map(
            (e) =>
              `- [${e.category}] ${e.name}: ${e.description}${
                e.currentStatus ? ` (Status: ${e.currentStatus})` : ''
              }`
          )
          .join('\n')
      : '(None recorded yet)';

  const threadsText =
    book.bible.openThreads.length > 0
      ? book.bible.openThreads
          .map((th) => `- [${th.status}] ${th.title}: ${th.notes}`)
          .join('\n')
      : '(None recorded yet)';

  const researchText =
    book.bible.researchItems.length > 0
      ? book.bible.researchItems
          .slice(0, 12)
          .map(
            (r) =>
              `- [${r.category}] ${r.title} (${r.authors.join(', ') || 'N/A'}, ${
                r.year || 'n.d.'
              })${r.notes ? ` — Notes: ${r.notes}` : ''}`
          )
          .join('\n')
      : '(None saved yet)';

  const specialFeatures = [
    book.settings.includeImages ? 'Illustrations/Images' : null,
    book.settings.includeTables ? 'Markdown Tables' : null,
    book.settings.includeFootnotes ? 'Footnotes' : null,
    book.settings.includeBibliography ? 'Bibliography/Citations' : null,
  ]
    .filter(Boolean)
    .join(', ');

  return `
=== BOOK METADATA ===
Title: ${book.title}${book.subtitle ? ` — ${book.subtitle}` : ''}
Genre: ${book.genreLabel}
Writing Language: ${book.settings.language} (ALWAYS respond and draft in ${book.settings.language} unless asked otherwise!)
Tone & Style: ${book.settings.tone}
Target Audience: ${book.settings.targetAudience}
Special Elements Requested: ${specialFeatures || 'Standard prose'}
${book.settings.specialNotes ? `Special Instructions: ${book.settings.specialNotes}` : ''}

=== BOOK BIBLE (CONTINUITY MEMORY) ===
Premise: ${book.bible.premise}
Purpose: ${book.bible.purpose}
Style Guidelines: ${book.bible.styleGuidelines}

Characters / Key Concepts / Rules:
${entitiesText}

Open Threads / Plot Points:
${threadsText}

Saved Research / Competing Works / Bibliography:
${researchText}

=== PREVIOUS CHAPTERS SUMMARY ===
${prevSummaries || '(This is the opening chapter of the book.)'}
${
  immediatePrevTail
    ? `\n=== ENDING OF PREVIOUS CHAPTER (${immediatePrev.number}: ${immediatePrev.title}) ===\n...${immediatePrevTail}`
    : ''
}

=== CURRENT ACTIVE CHAPTER (FRESH CONTEXT WINDOW) ===
Chapter ${chapter.number}: ${chapter.title}
Chapter Goal / Outline: ${chapter.outline || '(Open)'}
Current Draft Content:
${chapter.content || '(Empty draft so far)'}
`.trim();
}

export async function testGeminiConnection(config: AIProviderConfig): Promise<string> {
  return callGeminiRaw(
    config,
    'You are a connection test assistant.',
    [{ role: 'user', parts: [{ text: 'Reply with a single word: OK' }] }],
    false
  );
}

export async function onboardingBrainstorm(
  config: AIProviderConfig,
  idea: string,
  selectedGenreLabel: string,
  language: string
): Promise<string> {
  const sys = `You are a warm, insightful Literary Development Editor helping an author conceptualize a new book. Respond in ${language}. Ask 2-3 sharp guiding questions, suggest the best genre fit/angle, and highlight what makes this idea compelling. Keep it concise and encouraging.`;
  const prompt = `Genre currently selected: ${selectedGenreLabel || 'Not decided yet'}\nAuthor's idea/message:\n${idea}`;
  return callGeminiRaw(config, sys, [{ role: 'user', parts: [{ text: prompt }] }], false);
}

export interface GeneratedBlueprint {
  title: string;
  subtitle: string;
  premise: string;
  purpose: string;
  styleGuidelines: string;
  chapters: { number: number; title: string; outline: string }[];
  initialEntities: {
    name: string;
    category: 'character' | 'concept' | 'location' | 'rule';
    description: string;
  }[];
}

export async function generateBookBlueprint(
  config: AIProviderConfig,
  params: {
    idea: string;
    genreLabel: string;
    language: string;
    tone: string;
    targetAudience: string;
    specialElements: string[];
    specialNotes: string;
  }
): Promise<GeneratedBlueprint> {
  const sys = `You are an expert Book Architect & Publisher. Create a cohesive book concept and chapter-by-chapter outline in ${params.language}. Return STRICT JSON matching the requested schema.`;
  const prompt = `
Create a book blueprint in ${params.language} based on:
- Genre: ${params.genreLabel}
- Idea: ${params.idea}
- Tone: ${params.tone}
- Target Audience: ${params.targetAudience}
- Special Elements: ${params.specialElements.join(', ') || 'None'}
- Extra Notes: ${params.specialNotes || 'None'}

Return JSON with this exact structure:
{
  "title": "string",
  "subtitle": "string",
  "premise": "2-4 sentence engaging premise",
  "purpose": "1-2 sentence core purpose/thesis of the book",
  "styleGuidelines": "concise style and formatting rules",
  "chapters": [
    { "number": 1, "title": "string", "outline": "2-3 sentence chapter goal & key beats" }
  ],
  "initialEntities": [
    { "name": "string", "category": "character | concept | location | rule", "description": "short description" }
  ]
}
Provide 6 to 8 well-structured chapters and 3 to 5 initial entities (characters or key concepts).
`;
  const raw = await callGeminiRaw(config, sys, [{ role: 'user', parts: [{ text: prompt }] }], true);
  return safeParseJSON<GeneratedBlueprint>(raw);
}

export async function chatWithRole(
  config: AIProviderConfig,
  book: Book,
  chapter: Chapter,
  roleId: AIRoleId,
  userMessage: string,
  recentHistory: ChatMessage[]
): Promise<string> {
  const role = getRoleById(roleId);
  const context = buildChapterContextPrompt(book, chapter);
  const sys = `${role.systemPrompt}\n\nAlways respond in ${book.settings.language} unless the user explicitly asks for another language.\n\n${context}`;

  const contents: GeminiContent[] = recentHistory.slice(-10).map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));
  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  return callGeminiRaw(config, sys, contents, false);
}

export async function askCouncil(
  config: AIProviderConfig,
  book: Book,
  chapter: Chapter,
  roleIds: AIRoleId[],
  question: string
): Promise<CouncilFeedbackItem[]> {
  const context = buildChapterContextPrompt(book, chapter);
  const tasks = roleIds.map(async (roleId): Promise<CouncilFeedbackItem> => {
    const role = getRoleById(roleId);
    const sys = `${role.systemPrompt}\nGive a focused, distinctive perspective (120-220 words) from your specific role in ${book.settings.language}.\n\n${context}`;
    try {
      const feedback = await callGeminiRaw(
        config,
        sys,
        [{ role: 'user', parts: [{ text: question }] }],
        false
      );
      return { roleId, feedback };
    } catch (err) {
      return {
        roleId,
        feedback: '',
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  });
  return Promise.all(tasks);
}

export async function suggestChapterDirections(
  config: AIProviderConfig,
  book: Book,
  chapter: Chapter
): Promise<DirectionScenario[]> {
  const context = buildChapterContextPrompt(book, chapter);
  const sys = `You are a collaborative Co-Author. Based on the current chapter draft and Book Bible, propose 3 distinct, compelling directions/scenarios for what could happen next in this chapter. Write in ${book.settings.language}. Return STRICT JSON.`;
  const prompt = `${context}\n\nReturn JSON: { "scenarios": [ { "title": "short title", "description": "2-3 sentences explaining this direction", "toneImpact": "short note on pacing/reader effect" } ] }`;
  const raw = await callGeminiRaw(config, sys, [{ role: 'user', parts: [{ text: prompt }] }], true);
  const parsed = safeParseJSON<{ scenarios: DirectionScenario[] }>(raw);
  return parsed.scenarios || [];
}

export interface ChapterCompletionUpdate {
  chapterSummary: string;
  newOrUpdatedEntities: {
    name: string;
    category: 'character' | 'concept' | 'location' | 'rule';
    description: string;
    currentStatus: string;
  }[];
  openThreads: {
    title: string;
    status: 'open' | 'resolved';
    notes: string;
  }[];
}

export async function summarizeChapterAndUpdateBible(
  config: AIProviderConfig,
  book: Book,
  chapter: Chapter
): Promise<ChapterCompletionUpdate> {
  const context = buildChapterContextPrompt(book, chapter);
  const sys = `You are a Continuity Archivist. Extract a concise, fact-rich chapter summary and Book Bible updates from the completed chapter so future chapters maintain seamless continuity in fresh context windows. Write in ${book.settings.language}. Return STRICT JSON.`;
  const prompt = `${context}

Analyze Chapter ${chapter.number} ("${chapter.title}") and return JSON:
{
  "chapterSummary": "3-5 sentence dense summary of key events, arguments, facts, and emotional/logical outcome",
  "newOrUpdatedEntities": [
    { "name": "string", "category": "character | concept | location | rule", "description": "concise description", "currentStatus": "state at end of this chapter" }
  ],
  "openThreads": [
    { "title": "string", "status": "open | resolved", "notes": "brief context" }
  ]
}`;
  const raw = await callGeminiRaw(config, sys, [{ role: 'user', parts: [{ text: prompt }] }], true);
  return safeParseJSON<ChapterCompletionUpdate>(raw);
}

export async function analyzeRippleEffect(
  config: AIProviderConfig,
  book: Book,
  currentChapter: Chapter,
  changeDescription?: string
): Promise<RippleAnalysisResult> {
  const otherChapters = book.chapters
    .filter((c) => c.id !== currentChapter.id && (c.content.trim().length > 0 || c.outline.trim().length > 0))
    .map(
      (c) =>
        `--- CHAPTER ${c.number} (id: "${c.id}", title: "${c.title}") ---\nOutline: ${c.outline}\nSummary: ${c.summary}\nContent:\n${c.content.slice(
          0,
          3500
        )}`
    )
    .join('\n\n');

  if (!otherChapters) {
    return {
      summary:
        book.settings.language.toLowerCase().includes('ελλ')
          ? 'Δεν υπάρχουν ακόμα άλλα κεφάλαια με περιεχόμενο για σύγκριση.'
          : 'No other chapters with content exist yet to compare.',
      impacts: [],
    };
  }

  const sys = `You are a meticulous Book Continuity & Ripple-Effect Auditor. Compare the active chapter against ALL other chapters and the Book Bible. Identify any contradictions, character/fact/timeline inconsistencies, or planned chapters that must adapt because of changes in the active chapter. Respond in ${book.settings.language}. Return STRICT JSON.`;

  const prompt = `
=== BOOK BIBLE ===
Premise: ${book.bible.premise}
Entities: ${book.bible.entities.map((e) => `${e.name} (${e.currentStatus || e.description})`).join('; ')}

=== ACTIVE CHAPTER ${currentChapter.number}: ${currentChapter.title} ===
${changeDescription ? `Author's note about what changed: ${changeDescription}\n` : ''}
${currentChapter.content.slice(0, 5000)}

=== OTHER CHAPTERS IN THE BOOK ===
${otherChapters}

Return STRICT JSON:
{
  "summary": "1-2 sentence overall continuity assessment",
  "bibleUpdatesSuggested": "optional short note if Book Bible should be updated",
  "impacts": [
    {
      "chapterId": "exact id of the affected chapter from above",
      "chapterNumber": 1,
      "chapterTitle": "exact title",
      "severity": "high | medium | low",
      "reason": "clear explanation of why this chapter is affected",
      "originalExcerpt": "exact short excerpt from that chapter's content or outline that needs adjustment",
      "suggestedReplacement": "concrete updated wording that resolves the inconsistency"
    }
  ]
}
If everything is consistent, return an empty "impacts" array.
`;

  const raw = await callGeminiRaw(config, sys, [{ role: 'user', parts: [{ text: prompt }] }], true);
  return safeParseJSON<RippleAnalysisResult>(raw);
}

export async function analyzeResearchItems(
  config: AIProviderConfig,
  book: Book,
  items: ResearchItem[],
  customFocus?: string
): Promise<string> {
  const sys = `You are a combined Literary Market Strategist, Competitor Analyst, and Academic Research Advisor. Respond in ${book.settings.language}.`;
  const list = items
    .map(
      (r, i) =>
        `${i + 1}. [${r.category}] "${r.title}" — ${r.authors.join(', ') || 'Unknown'} (${
          r.year || 'n.d.'
        })${r.summary ? ` | ${r.summary}` : ''}`
    )
    .join('\n');

  const prompt = `
Book: "${book.title}" (${book.genreLabel})
Premise: ${book.bible.premise}
Purpose: ${book.bible.purpose}

Saved Research / Competing Works / Scientific Sources:
${list}

${customFocus ? `Specific author question: ${customFocus}\n` : ''}
Provide a clear, structured analysis covering:
1. Key insights from these works / literature.
2. How "${book.title}" can differentiate itself from competing works (unique angle / gap).
3. Practical suggestions on how to cite or leverage these sources in specific chapters.
`;

  return callGeminiRaw(config, sys, [{ role: 'user', parts: [{ text: prompt }] }], false);
}

export async function generateDistributionPlan(
  config: AIProviderConfig,
  book: Book
): Promise<DistributionPlan> {
  const chaptersOverview = book.chapters
    .map((c) => `Ch ${c.number}: ${c.title} — ${c.summary || c.outline}`)
    .join('\n');

  const sys = `You are a veteran Book Publisher, Literary Agent, and Marketing Strategist. Create a practical distribution, positioning, and future evolution plan in ${book.settings.language}. Return STRICT JSON.`;
  const prompt = `
Book: "${book.title}" ${book.subtitle ? `— ${book.subtitle}` : ''}
Genre: ${book.genreLabel}
Language: ${book.settings.language}
Target Audience: ${book.settings.targetAudience}
Premise: ${book.bible.premise}
Purpose: ${book.bible.purpose}
Chapters:
${chaptersOverview}

Return JSON:
{
  "blurb": "Compelling 120-160 word back-cover blurb ready for publication",
  "positioning": "2-3 sentences on market positioning, ideal reader profile, and unique selling hook",
  "channels": ["4-5 concrete distribution/publishing channels with brief rationale"],
  "evolutionIdeas": ["4-5 ideas for sequels, companion guides, translations, audio/interactive editions, or community expansion"]
}
`;
  const raw = await callGeminiRaw(config, sys, [{ role: 'user', parts: [{ text: prompt }] }], true);
  const parsed = safeParseJSON<Omit<DistributionPlan, 'generatedAt'>>(raw);
  return {
    ...parsed,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Attempts image generation using Gemini 2.0 Flash image-generation endpoint if available on the user's API key.
 * Falls back cleanly with an explanatory error if the key/region doesn't support image generation.
 */
export async function generateBookImage(
  config: AIProviderConfig,
  prompt: string
): Promise<string> {
  if (!config.apiKey.trim()) {
    throw new Error('Missing Gemini API Key.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${encodeURIComponent(
    config.apiKey.trim()
  )}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      msg = err?.error?.message || msg;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data && part.inlineData?.mimeType) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  throw new Error('No image was returned by the model. Try uploading an image or using the Art Director prompt.');
}
