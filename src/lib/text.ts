/**
 * Turn a page's Markdown into a short, readable preview. This is deliberately
 * forgiving: it removes the most common syntax rather than trying to parse
 * Markdown, because it only feeds summaries and search snippets.
 */
export function plainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s*[-*+]\s+\[[ xX]\]\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .replace(/\|/g, ' ')
    .replace(/^\s*[-:]{3,}\s*$/gm, ' ')
    .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function snippet(markdown: string, length = 170): string {
  const text = plainText(markdown);
  if (text.length <= length) return text;
  const cut = text.slice(0, length);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > length * 0.6 ? lastSpace : length).trimEnd()}…`;
}

export function searchSnippet(markdown: string, query: string, length = 220): string {
  const text = plainText(markdown);
  if (!text) return '';
  const at = text.toLowerCase().indexOf(query.toLowerCase());
  if (at < 0) return snippet(markdown, length);

  const start = Math.max(0, at - 70);
  const end = Math.min(text.length, start + length);
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${
    end < text.length ? '…' : ''
  }`;
}

export function readingTime(markdown: string): string {
  const words = plainText(markdown).split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}
