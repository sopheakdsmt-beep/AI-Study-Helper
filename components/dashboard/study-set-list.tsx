import Link from "next/link";
import { BookOpen, Layers, MessageSquare, Sparkles } from "lucide-react";
import type { StudySetWithCounts } from "@/types/database";
import { DeleteStudySetButton } from "@/components/dashboard/delete-study-set-button";
import { CreateStudySetDialog } from "@/components/dashboard/create-study-set-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StudySetListProps {
  studySets: StudySetWithCounts[];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function StudySetList({ studySets }: StudySetListProps) {
  if (studySets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No study sets yet</CardTitle>
          <CardDescription>
            Create your first study set to start organizing notes. Upload and AI
            tools arrive in later phases.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateStudySetDialog />
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="space-y-3">
      {studySets.map((set) => (
        <li key={set.id}>
          <Card className="transition-colors hover:bg-muted/30">
            <CardContent className="flex items-start justify-between gap-4 p-4 sm:p-5">
              <Link
                href={`/set/${set.id}`}
                className="min-w-0 flex-1 space-y-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-lg font-semibold">{set.title}</h2>
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                    {set.language === "km" ? "Khmer" : "English"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Created {formatDate(set.created_at)}
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground sm:text-sm">
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden />
                    {set.summary_count} summaries
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" aria-hidden />
                    {set.flashcard_count} flashcards
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" aria-hidden />
                    {set.quiz_count} quizzes
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" aria-hidden />
                    {set.chat_count} messages
                  </span>
                </div>
              </Link>
              <DeleteStudySetButton studySetId={set.id} title={set.title} />
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
