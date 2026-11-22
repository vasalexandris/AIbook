import { marked } from 'marked';
import { Book, BookFontFamily } from '../types/book';

marked.setOptions({
  gfm: true,
  breaks: true,
});

export function renderMarkdownHtml(md: string): string {
  if (!md) return '';
  return marked.parse(md) as string;
}

export function countWords(text: string): number {
  const cleaned = text.trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).length;
}

export function countBookWords(book: Book): number {
  return book.chapters.reduce((sum, ch) => sum + countWords(ch.content), 0);
}

export function getFontClass(font: BookFontFamily): string {
  switch (font) {
    case 'newsreader':
      return 'font-editorial';
    case 'garamond':
      return 'font-garamond';
    case 'merriweather':
      return 'font-merriweather';
    case 'sans':
      return 'font-sans-book';
    case 'mono':
      return 'font-mono-book';
    case 'literata':
    default:
      return 'font-literata';
  }
}

export const BOOK_FONT_OPTIONS: { id: BookFontFamily; label: string; sample: string }[] = [
  { id: 'literata', label: 'Literata (Editorial Serif)', sample: 'Αα Bb — Κλασική αναγνωστική γραμματοσειρά' },
  { id: 'newsreader', label: 'Newsreader (Literary Serif)', sample: 'Αα Bb — Λογοτεχνική, κομψή αίσθηση' },
  { id: 'garamond', label: 'EB Garamond (Classic Book)', sample: 'Αα Bb — Παραδοσιακή τυπογραφία βιβλίου' },
  { id: 'merriweather', label: 'Merriweather (Readable Serif)', sample: 'Αα Bb — Ευανάγνωστη για δοκίμια & μελέτες' },
  { id: 'sans', label: 'Inter (Modern Sans)', sample: 'Αα Bb — Καθαρή για εγχειρίδια & tech' },
  { id: 'mono', label: 'JetBrains Mono', sample: 'Αα Bb — Τεχνικά κείμενα & σημειώσεις' },
];

export function compileBookToMarkdown(book: Book): string {
  const lines: string[] = [];
  lines.push(`# ${book.title}`);
  if (book.subtitle) lines.push(`### ${book.subtitle}`);
  if (book.authorName) lines.push(`\n*${book.authorName}*`);
  lines.push('\n---\n');

  if (book.bible.premise) {
    lines.push(`> ${book.bible.premise}\n`);
    lines.push('---\n');
  }

  for (const ch of [...book.chapters].sort((a, b) => a.number - b.number)) {
    lines.push(`\n## ${ch.number}. ${ch.title}\n`);
    lines.push(ch.content.trim() || '*[Draft pending]*');
    lines.push('\n');
  }

  if (book.bible.researchItems.length > 0 && book.settings.includeBibliography) {
    lines.push('\n---\n');
    lines.push('## Bibliography & References\n');
    for (const r of book.bible.researchItems) {
      const authors = r.authors.length ? r.authors.join(', ') : 'Unknown';
      const yr = r.year ? ` (${r.year})` : '';
      const link = r.doi ? ` — https://doi.org/${r.doi}` : r.url ? ` — ${r.url}` : '';
      lines.push(`- ${authors}${yr}. *${r.title}*.${link}`);
    }
  }

  return lines.join('\n');
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
