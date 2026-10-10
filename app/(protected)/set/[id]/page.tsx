import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StudySetPageProps {
  params: { id: string };
}

export default async function StudySetPage({ params }: StudySetPageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: studySet, error } = await supabase
    .from("study_sets")
    .select("id, title, language, source_type, raw_text, created_at")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !studySet) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard" aria-label="Back to dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{studySet.title}</h1>
          <p className="text-sm text-muted-foreground">
            Language: {studySet.language === "km" ? "Khmer" : "English"} · Source:{" "}
            {studySet.source_type}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload coming in Phase 3</CardTitle>
          <CardDescription>
            Summary, Flashcards, Quiz, and Chat tabs will appear here after you
            add notes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {studySet.raw_text
              ? `${studySet.raw_text.slice(0, 280)}${studySet.raw_text.length > 280 ? "…" : ""}`
              : "No notes uploaded yet. Return to the dashboard or wait for Phase 3 to add PDF/DOCX/TXT content."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
