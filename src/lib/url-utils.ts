/**
 * Returns the hostname of a URL, or `undefined` when it cannot be parsed.
 *
 * Used to populate `conversionOptions.html.hostname` so that toMarkdown can
 * resolve relative links on pages that do not declare a `<base>` element.
 */
export function safeHostname(url: string): string | undefined {
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}
