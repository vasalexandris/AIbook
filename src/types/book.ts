export type UILanguage = 'el' | 'en';
export type ThemeMode = 'light' | 'dark';

export type BookFontFamily =
  | 'literata'
  | 'newsreader'
  | 'garamond'
  | 'merriweather'
  | 'sans'
  | 'mono';

export type AIRoleGroup = 'creation' | 'quality' | 'market';

export type AIRoleId =
  | 'coauthor'
  | 'assistant'
  | 'researcher'
  | 'art_director'
  | 'editor'
  | 'continuity'
  | 'analyst'
  | 'reader'
  | 'buyer'
  | 'publisher'
  | 'critic'
  | 'salesperson'
  | 'competitor';

export interface BookSettings {
  language: string; // e.g., 'Ελληνικά', 'English', etc.
  fontFamily: BookFontFamily;
  fontSize: number; // px, e.g. 16..22
  tone: string;
  targetAudience: string;
  includeImages: boolean;
  includeTables: boolean;
  includeFootnotes: boolean;
  includeBibliography: boolean;
  specialNotes: string;
}

export interface BibleEntity {
  id: string;
  name: string;
  category: 'character' | 'concept' | 'location' | 'rule';
  description: string;
  currentStatus: string;
}

export interface OpenThread {
  id: string;
  title: string;
  status: 'open' | 'resolved';
  notes: string;
}

export interface ResearchItem {
  id: string;
  title: string;
  authors: string[];
  year?: string;
  source: 'openlibrary' | 'crossref' | 'openalex' | 'manual';
  category: 'competitor' | 'scientific' | 'inspiration' | 'reference';
  summary?: string;
  url?: string;
  doi?: string;
  citationCount?: number;
  notes?: string;
  addedAt: string;
}

export interface BookBible {
  premise: string;
  purpose: string;
  styleGuidelines: string;
  entities: BibleEntity[];
  openThreads: OpenThread[];
  researchItems: ResearchItem[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  aiPersona?: AIRoleId;
  content: string;
  timestamp: string;
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  outline: string;
  content: string;
  summary: string;
  status: 'planned' | 'draft' | 'completed';
  chatHistory: ChatMessage[];
  updatedAt: string;
}

export interface DistributionPlan {
  blurb: string;
  positioning: string;
  channels: string[];
  evolutionIdeas: string[];
  generatedAt: string;
}

export interface Book {
  id: string;
  title: string;
  subtitle: string;
  authorName: string;
  genreId: string;
  genreLabel: string;
  settings: BookSettings;
  bible: BookBible;
  chapters: Chapter[];
  distributionPlan?: DistributionPlan;
  createdAt: string;
  updatedAt: string;
}

export interface RippleImpactItem {
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  severity: 'high' | 'medium' | 'low';
  reason: string;
  originalExcerpt: string;
  suggestedReplacement: string;
  applied?: boolean;
  dismissed?: boolean;
}

export interface RippleAnalysisResult {
  summary: string;
  bibleUpdatesSuggested?: string;
  impacts: RippleImpactItem[];
}

export interface DirectionScenario {
  title: string;
  description: string;
  toneImpact: string;
}

export interface CouncilFeedbackItem {
  roleId: AIRoleId;
  feedback: string;
  error?: string;
}

export interface AIProviderConfig {
  provider: 'gemini';
  apiKey: string;
  model: string;
}
