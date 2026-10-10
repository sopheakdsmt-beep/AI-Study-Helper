/**
 * Normalize extracted note text for storage and later AI use.
 */
export function cleanExtractedText(input: string): string {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_PASTE_CHARS = 200_000;
export const MIN_TEXT_CHARS = 20;
