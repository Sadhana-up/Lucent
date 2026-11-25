export type InlineToken =
  | { type: 'text'; text: string; bold?: boolean }
  | { type: 'link'; text: string; href: string; bold?: boolean };

const BLOCK_MARKERS = [
  [/^#{1,6}\s+(.+)$/gm, '**$1**'], // headings -> bold
  [/^[-*]\s+/gm, '• '], // bullets
] as const;

/**
 * Splits assistant markdown into inline pieces RN can render: **bold**,
 * [label](/shop/slug), and plain text. Bold is tracked as a state so a link
 * nested inside **…** (e.g. "### 1. [Product](/shop/x)") stays tappable.
 */
export function parseMessageMarkdown(source: string): InlineToken[] {
  const text = BLOCK_MARKERS.reduce((acc, [re, rep]) => acc.replace(re, rep), source);
  const tokens: InlineToken[] = [];
  let last = 0;
  let bold = false;

  for (const match of text.matchAll(/\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g)) {
    const index = match.index ?? 0;
    if (index > last) tokens.push({ type: 'text', text: text.slice(last, index), bold });
    if (match[0] === '**') bold = !bold;
    else tokens.push({ type: 'link', text: match[1], href: match[2], bold });
    last = index + match[0].length;
  }

  if (last < text.length) tokens.push({ type: 'text', text: text.slice(last), bold });
  return tokens;
}

/**
 * `/shop/<slug>`, `/product/<slug>` and their absolute forms are product links.
 */
export function productSlugFromHref(href: string): string | null {
  const match = /^(?:https?:\/\/[^/]+)?\/(?:shop|product)\/([^/?#]+)/.exec(href);
  return match ? decodeURIComponent(match[1]) : null;
}
