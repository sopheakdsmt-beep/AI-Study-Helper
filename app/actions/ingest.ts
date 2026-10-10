"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  cleanExtractedText,
  MAX_UPLOAD_BYTES,
  MIN_TEXT_CHARS,
} from "@/lib/parsers/clean-text";
import { extractFromUpload } from "@/lib/parsers/extract";
import { pasteNotesSchema } from "@/lib/validators/ingest";
import type { ActionResult } from "@/app/actions/study-sets";
import type { SourceType } from "@/types/database";

async function getOwnedStudySet(studySetId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, studySet: null, error: "You must be signed in." };
  }

  const { data: studySet, error } = await supabase
    .from("study_sets")
    .select("id, user_id")
    .eq("id", studySetId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !studySet) {
    return {
      supabase,
      user,
      studySet: null,
      error: "Study set not found.",
    };
  }

  return { supabase, user, studySet, error: null };
}

async function saveRawText(
  studySetId: string,
  rawText: string,
  sourceType: SourceType
): Promise<ActionResult<{ characterCount: number; sourceType: SourceType }>> {
  const owned = await getOwnedStudySet(studySetId);
  if (owned.error || !owned.studySet) {
    return { success: false, error: owned.error ?? "Study set not found." };
  }

  const { error } = await owned.supabase
    .from("study_sets")
    .update({
      raw_text: rawText,
      source_type: sourceType,
    })
    .eq("id", studySetId)
    .eq("user_id", owned.user!.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/set/${studySetId}`);

  return {
    success: true,
    data: { characterCount: rawText.length, sourceType },
  };
}

export async function pasteNotesAction(input: {
  studySetId: string;
  text: string;
}): Promise<ActionResult<{ characterCount: number; sourceType: SourceType }>> {
  const parsed = pasteNotesSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const cleaned = cleanExtractedText(parsed.data.text);
  if (cleaned.length < MIN_TEXT_CHARS) {
    return {
      success: false,
      error: `Paste at least ${MIN_TEXT_CHARS} characters of study material.`,
    };
  }

  return saveRawText(parsed.data.studySetId, cleaned, "paste");
}

export async function uploadNotesAction(
  formData: FormData
): Promise<ActionResult<{ characterCount: number; sourceType: SourceType }>> {
  const studySetId = String(formData.get("studySetId") ?? "");
  const file = formData.get("file");

  if (!studySetId) {
    return { success: false, error: "Missing study set id." };
  }

  if (!(file instanceof File)) {
    return { success: false, error: "Choose a PDF, DOCX, or TXT file." };
  }

  if (file.size <= 0) {
    return { success: false, error: "The selected file is empty." };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return { success: false, error: "File is too large. Maximum size is 10MB." };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const extracted = await extractFromUpload(file.name, file.type, buffer);
    return saveRawText(studySetId, extracted.text, extracted.sourceType);
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to extract text from that file.",
    };
  }
}

export async function clearNotesAction(
  studySetId: string
): Promise<ActionResult> {
  const owned = await getOwnedStudySet(studySetId);
  if (owned.error || !owned.studySet) {
    return { success: false, error: owned.error ?? "Study set not found." };
  }

  const { error } = await owned.supabase
    .from("study_sets")
    .update({
      raw_text: "",
      source_type: "empty",
    })
    .eq("id", studySetId)
    .eq("user_id", owned.user!.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/set/${studySetId}`);
  return { success: true, data: undefined };
}
