import { z } from "zod";
import { MAX_PASTE_CHARS, MIN_TEXT_CHARS } from "@/lib/parsers/clean-text";

export const pasteNotesSchema = z.object({
  studySetId: z.string().uuid("Invalid study set"),
  text: z
    .string()
    .trim()
    .min(MIN_TEXT_CHARS, `Paste at least ${MIN_TEXT_CHARS} characters`)
    .max(MAX_PASTE_CHARS, `Text must be under ${MAX_PASTE_CHARS.toLocaleString()} characters`),
});

export type PasteNotesInput = z.infer<typeof pasteNotesSchema>;

export const ALLOWED_UPLOAD_EXTENSIONS = [".pdf", ".docx", ".txt"] as const;
export const ALLOWED_UPLOAD_ACCEPT =
  ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";
