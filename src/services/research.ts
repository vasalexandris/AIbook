import { ResearchItem } from '../types/book';

export type ResearchSourceFilter = 'all' | 'openlibrary' | 'crossref' | 'openalex';

export interface SearchResultItem {
  id: string;
  title: string;
  authors: string[];
  year?: string;
  source: 'openlibrary' | 'crossref' | 'openalex';
  summary?: string;
  url?: string;
  doi?: string;
  citationCount?: number;
  venue?: string;
}

export async function searchOpenLibrary(query: string): Promise<SearchResultItem[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open Library error (${res.status})`);
  const data = await res.json();
  const docs = Array.isArray(data.docs) ? data.docs : [];
  return docs.map((d: Record<string, unknown>, idx: number) => ({
    id: `ol-${String(d.key || idx)}`,
    title: String(d.title || 'Untitled'),
    authors: Array.isArray(d.author_name) ? (d.author_name as string[]).slice(0, 3) : [],
    year: d.first_publish_year ? String(d.first_publish_year) : undefined,
    source: 'openlibrary' as const,
    summary: Array.isArray(d.subject)
      ? `Topics: ${(d.subject as string[]).slice(0, 5).join(', ')}`
      : undefined,
    url: d.key ? `https://openlibrary.org${String(d.key)}` : undefined,
  }));
}

export async function searchCrossref(query: string): Promise<SearchResultItem[]> {
  const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=8`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Crossref error (${res.status})`);
  const data = await res.json();
  const items = data?.message?.items || [];
  return items.map((item: Record<string, unknown>, idx: number) => {
    const titleArr = item.title as string[] | undefined;
    const authorArr = item.author as { given?: string; family?: string }[] | undefined;
    const published = (item['published-print'] || item['published-online'] || item.created) as
      | { 'date-parts'?: number[][] }
      | undefined;
    const year = published?.['date-parts']?.[0]?.[0];
    const container = item['container-title'] as string[] | undefined;
    const doi = item.DOI ? String(item.DOI) : undefined;
    return {
      id: `cr-${doi || idx}`,
      title: titleArr?.[0] || 'Untitled Work',
      authors: authorArr
        ? authorArr
            .slice(0, 4)
            .map((a) => [a.given, a.family].filter(Boolean).join(' '))
            .filter(Boolean)
        : [],
      year: year ? String(year) : undefined,
      source: 'crossref' as const,
      doi,
      url: doi ? `https://doi.org/${doi}` : (item.URL as string | undefined),
      citationCount: typeof item['is-referenced-by-count'] === 'number'
        ? (item['is-referenced-by-count'] as number)
        : undefined,
      venue: container?.[0],
      summary: container?.[0] ? `Published in: ${container[0]}` : undefined,
    };
  });
}

function reconstructOpenAlexAbstract(inverted?: Record<string, number[]>): string | undefined {
  if (!inverted) return undefined;
  const words: string[] = [];
  for (const [word, positions] of Object.entries(inverted)) {
    for (const pos of positions) {
      words[pos] = word;
    }
  }
  const text = words.filter(Boolean).join(' ').trim();
  return text.length > 320 ? `${text.slice(0, 320)}...` : text;
}

export async function searchOpenAlex(query: string): Promise<SearchResultItem[]> {
  const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=8`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenAlex error (${res.status})`);
  const data = await res.json();
  const results = Array.isArray(data.results) ? data.results : [];
  return results.map((w: Record<string, unknown>, idx: number) => {
    const authorships = w.authorships as { author?: { display_name?: string } }[] | undefined;
    const primaryLoc = w.primary_location as { source?: { display_name?: string }; landing_page_url?: string } | undefined;
    const doiRaw = w.doi ? String(w.doi) : undefined;
    const doi = doiRaw?.replace('https://doi.org/', '');
    return {
      id: `oa-${String(w.id || idx)}`,
      title: String(w.title || 'Untitled Paper'),
      authors: authorships
        ? authorships
            .slice(0, 4)
            .map((a) => a.author?.display_name || '')
            .filter(Boolean)
        : [],
      year: w.publication_year ? String(w.publication_year) : undefined,
      source: 'openalex' as const,
      doi,
      url: doiRaw || primaryLoc?.landing_page_url || (w.id as string | undefined),
      citationCount: typeof w.cited_by_count === 'number' ? (w.cited_by_count as number) : undefined,
      venue: primaryLoc?.source?.display_name,
      summary:
        reconstructOpenAlexAbstract(w.abstract_inverted_index as Record<string, number[]> | undefined) ||
        (primaryLoc?.source?.display_name ? `Source: ${primaryLoc.source.display_name}` : undefined),
    };
  });
}

export async function searchResearch(
  query: string,
  filter: ResearchSourceFilter
): Promise<SearchResultItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  if (filter === 'openlibrary') return searchOpenLibrary(trimmed);
  if (filter === 'crossref') return searchCrossref(trimmed);
  if (filter === 'openalex') return searchOpenAlex(trimmed);

  const settled = await Promise.allSettled([
    searchOpenLibrary(trimmed),
    searchCrossref(trimmed),
    searchOpenAlex(trimmed),
  ]);

  const combined: SearchResultItem[] = [];
  for (const res of settled) {
    if (res.status === 'fulfilled') {
      combined.push(...res.value.slice(0, 5));
    }
  }
  return combined;
}

export function formatAPACitation(item: ResearchItem): string {
  const authors = item.authors.length > 0 ? item.authors.join(', ') : 'Unknown Author';
  const year = item.year ? `(${item.year})` : '(n.d.)';
  const doiPart = item.doi ? ` https://doi.org/${item.doi}` : item.url ? ` ${item.url}` : '';
  return `${authors} ${year}. ${item.title}.${doiPart}`;
}
