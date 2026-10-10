import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";
import {
  cleanExtractedText,
  MAX_UPLOAD_BYTES,
  MIN_TEXT_CHARS,
} from "@/lib/parsers/clean-text";
import type { SourceType } from "@/types/database";

export type ExtractResult = {
  text: string;
  sourceType: Exclude<SourceType, "empty">;
};

function assertFileSize(size: number) {
  if (size > MAX_UPLOAD_BYTES) {
    throw new Error("File is too large. Maximum size is 10MB.");
  }
}

export async function extractFromTxt(buffer: Buffer): Promise<ExtractResult> {
  assertFileSize(buffer.byteLength);
  const text = cleanExtractedText(buffer.toString("utf8"));
  if (text.length < MIN_TEXT_CHARS) {
    throw new Error("Could not find enough readable text in that file.");
  }
  return { text, sourceType: "txt" };
}

export async function extractFromDocx(buffer: Buffer): Promise<ExtractResult> {
  assertFileSize(buffer.byteLength);
  const result = await mammoth.extractRawText({ buffer });
  const text = cleanExtractedText(result.value ?? "");
  if (text.length < MIN_TEXT_CHARS) {
    throw new Error("Could not find enough readable text in that DOCX file.");
  }
  return { text, sourceType: "docx" };
}

export async function extractFromPdf(buffer: Buffer): Promise<ExtractResult> {
  assertFileSize(buffer.byteLength);
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  const cleaned = cleanExtractedText(text);
  if (cleaned.length < MIN_TEXT_CHARS) {
    throw new Error(
      "Could not find enough readable text in that PDF. Try a text-based PDF (not a scanned image)."
    );
  }
  return { text: cleaned, sourceType: "pdf" };
}

export async function extractFromUpload(
  fileName: string,
  mimeType: string,
  buffer: Buffer
): Promise<ExtractResult> {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".pdf") || mimeType === "application/pdf") {
    return extractFromPdf(buffer);
  }

  if (
    lower.endsWith(".docx") ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return extractFromDocx(buffer);
  }

  if (
    lower.endsWith(".txt") ||
    mimeType === "text/plain" ||
    mimeType.startsWith("text/")
  ) {
    return extractFromTxt(buffer);
  }

  throw new Error("Unsupported file type. Upload a PDF, DOCX, or TXT file.");
}
