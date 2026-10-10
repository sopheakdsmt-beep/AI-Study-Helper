import { createClient } from "@/lib/supabase/server";
import type { StudySetWithCounts } from "@/types/database";

export async function getStudySetsForCurrentUser(): Promise<StudySetWithCounts[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: studySets, error } = await supabase
    .from("study_sets")
    .select("id, user_id, title, source_type, raw_text, language, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  if (!studySets || studySets.length === 0) {
    return [];
  }

  const ids = studySets.map((set) => set.id);

  const [summaries, flashcards, quizzes, chats] = await Promise.all([
    supabase.from("summaries").select("study_set_id").in("study_set_id", ids),
    supabase.from("flashcards").select("study_set_id").in("study_set_id", ids),
    supabase.from("quizzes").select("study_set_id").in("study_set_id", ids),
    supabase.from("chat_messages").select("study_set_id").in("study_set_id", ids),
  ]);

  const countBy = (rows: { study_set_id: string }[] | null) => {
    const map = new Map<string, number>();
    for (const row of rows ?? []) {
      map.set(row.study_set_id, (map.get(row.study_set_id) ?? 0) + 1);
    }
    return map;
  };

  const summaryCounts = countBy(summaries.data);
  const flashcardCounts = countBy(flashcards.data);
  const quizCounts = countBy(quizzes.data);
  const chatCounts = countBy(chats.data);

  return studySets.map((set) => ({
    ...set,
    summary_count: summaryCounts.get(set.id) ?? 0,
    flashcard_count: flashcardCounts.get(set.id) ?? 0,
    quiz_count: quizCounts.get(set.id) ?? 0,
    chat_count: chatCounts.get(set.id) ?? 0,
  }));
}
