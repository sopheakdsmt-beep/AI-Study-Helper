import { CreateStudySetDialog } from "@/components/dashboard/create-study-set-dialog";
import { StudySetList } from "@/components/dashboard/study-set-list";
import { getStudySetsForCurrentUser } from "@/lib/study-sets";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { StudySetWithCounts } from "@/types/database";

export default async function DashboardPage() {
  let studySets: StudySetWithCounts[] = [];
  let loadError: string | null = null;

  try {
    studySets = await getStudySetsForCurrentUser();
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Could not load study sets. Did you run the SQL migration?";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Create and manage your study sets.
          </p>
        </div>
        <CreateStudySetDialog />
      </div>

      {loadError ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load study sets</AlertTitle>
          <AlertDescription>
            {loadError} Apply{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              supabase/migrations/20260310000000_init_schema.sql
            </code>{" "}
            in the Supabase SQL Editor, then refresh.
          </AlertDescription>
        </Alert>
      ) : (
        <StudySetList studySets={studySets} />
      )}
    </div>
  );
}
