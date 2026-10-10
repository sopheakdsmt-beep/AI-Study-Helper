"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createStudySetSchema,
  type CreateStudySetInput,
} from "@/lib/validators/study-set";

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createStudySetAction(
  input: CreateStudySetInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = createStudySetSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be signed in." };
  }

  // Ensure a profile row exists (covers users created before the migration trigger).
  await supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name:
        (user.user_metadata?.display_name as string | undefined) ??
        user.email?.split("@")[0] ??
        null,
    },
    { onConflict: "id" }
  );

  const { data, error } = await supabase
    .from("study_sets")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      language: parsed.data.language,
      source_type: "empty",
      raw_text: "",
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      success: false,
      error: error?.message ?? "Failed to create study set.",
    };
  }

  revalidatePath("/dashboard");
  return { success: true, data: { id: data.id } };
}

export async function deleteStudySetAction(
  studySetId: string
): Promise<ActionResult> {
  if (!studySetId) {
    return { success: false, error: "Missing study set id." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be signed in." };
  }

  const { error } = await supabase
    .from("study_sets")
    .delete()
    .eq("id", studySetId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}
