// Timeouts (ms)
export const FETCH_TIMEOUT = 30_000;
export const DOCUMENT_DOWNLOAD_TIMEOUT = 60_000;
export const WAIT_FOR_SELECTOR_TIMEOUT = 15_000;

// Size limits (bytes)
export const MAX_RESPONSE_SIZE = 50 * 1024 * 1024; // 50 MB

export const USER_AGENT =
  "Web2MarkDown/1.0 (MCP Server; +https://github.com/web2markdown-mcp)";

const MIME_TO_EXT: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    ".pptx",
  "text/csv": ".csv",
  "application/xml": ".xml",
  "text/xml": ".xml",
};

export function extractFilename(
  url: string,
  contentType: string | null,
): string {
  try {
    const pathname = new URL(url).pathname;
    const lastSegment = pathname.split("/").pop();
    if (lastSegment && lastSegment.includes(".")) {
      return lastSegment;
    }
  } catch {
    // ignore
  }
  const ext = contentType
    ? MIME_TO_EXT[contentType.split(";")[0].trim()]
    : undefined;
  return `document${ext ?? ""}`;
}
