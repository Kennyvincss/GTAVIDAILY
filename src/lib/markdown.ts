import { marked, type Token } from "marked";

/**
 * Render article Markdown into HTML chunks, split after the Nth paragraph so an
 * in-article ad can be placed between them. Article bodies are written by
 * trusted administrators.
 */
export function renderArticleChunks(markdown: string, splitAfterParagraph = 3): string[] {
  const tokens = marked.lexer(markdown);
  let paragraphs = 0;
  let splitIndex = -1;
  tokens.forEach((t: Token, i) => {
    if (t.type === "paragraph") {
      paragraphs++;
      if (paragraphs === splitAfterParagraph && splitIndex === -1) splitIndex = i + 1;
    }
  });
  // Only split when there is meaningful content on both sides.
  if (splitIndex === -1 || splitIndex >= tokens.length) {
    return [marked.parser(tokens)];
  }
  const first = Object.assign(tokens.slice(0, splitIndex), { links: tokens.links });
  const second = Object.assign(tokens.slice(splitIndex), { links: tokens.links });
  return [marked.parser(first), marked.parser(second)];
}
