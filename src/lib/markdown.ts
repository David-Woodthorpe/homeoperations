import { Marked, type Token, type Tokens } from 'marked';

export type WikiTarget = { id: string; title: string };

export type RenderOptions = {
  /** Page titles that `[[wiki links]]` can resolve to. */
  pages?: WikiTarget[];
  /** Printed pages cannot be clicked, so show wiki links as plain text. */
  forPrint?: boolean;
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const safeHref = (href: string): string | null => {
  const value = href.trim();
  if (!value) return null;
  if (value.startsWith('//')) return null;
  if (value.startsWith('#') || value.startsWith('/')) return value;
  if (/^(https?:|mailto:|tel:)/i.test(value)) return value;
  return null;
};

type WikiToken = Token & { type: 'wikiLink'; raw: string; title: string };

/**
 * Markdown rendering shared by the server (pages, print) and the browser
 * (editor preview). Raw HTML is shown as text rather than executed, and links
 * are limited to http(s), mailto, tel and in-app links.
 */
export function renderMarkdown(source: string, options: RenderOptions = {}): string {
  const pages = options.pages ?? [];
  const lookup = new Map<string, string | null>();
  for (const page of pages) {
    const key = page.title.trim().toLowerCase();
    lookup.set(key, lookup.has(key) ? null : page.id);
  }

  const marked = new Marked({ gfm: true, breaks: true, async: false });

  marked.use({
    renderer: {
      html({ text }: Tokens.HTML | Tokens.Tag) {
        return `<span class="raw-html">${escapeHtml(text)}</span>`;
      },
      link(token: Tokens.Link) {
        const text = this.parser.parseInline(token.tokens);
        const href = safeHref(token.href);
        if (!href) return text;
        const title = token.title ? ` title="${escapeHtml(token.title)}"` : '';
        const external = /^https?:/i.test(href);
        const rel = external ? ' rel="noreferrer noopener"' : '';
        const target = external && !options.forPrint ? ' target="_blank"' : '';
        const shown = options.forPrint && external && !text.includes(href)
          ? `${text} <span class="print-url">${escapeHtml(href)}</span>`
          : text;
        return `<a href="${escapeHtml(href)}"${title}${rel}${target}>${shown}</a>`;
      }
    },
    extensions: [
      {
        name: 'wikiLink',
        level: 'inline',
        start(src: string) {
          return src.indexOf('[[');
        },
        tokenizer(src: string) {
          const match = /^\[\[([^\]\n]{1,200})\]\]/.exec(src);
          if (!match) return undefined;
          return {
            type: 'wikiLink',
            raw: match[0],
            title: match[1].trim()
          } satisfies WikiToken;
        },
        renderer(token: Token) {
          const wiki = token as WikiToken;
          const id = lookup.get(wiki.title.toLowerCase());
          if (!id) {
            return `<span class="wikilink missing" title="No page with this title">${escapeHtml(
              wiki.title
            )}</span>`;
          }
          if (options.forPrint) {
            return `<span class="wikilink">${escapeHtml(wiki.title)}</span>`;
          }
          return `<a class="wikilink" href="/pages/${id}">${escapeHtml(wiki.title)}</a>`;
        }
      }
    ]
  });

  return marked.parse(source) as string;
}
