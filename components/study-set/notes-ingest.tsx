"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  clearNotesAction,
  pasteNotesAction,
  uploadNotesAction,
} from "@/app/actions/ingest";
import { MAX_UPLOAD_BYTES } from "@/lib/parsers/clean-text";
import { ALLOWED_UPLOAD_ACCEPT } from "@/lib/validators/ingest";
import type { SourceType } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface NotesIngestProps {
  studySetId: string;
  sourceType: SourceType;
  rawText: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function NotesIngest({
  studySetId,
  sourceType,
  rawText,
}: NotesIngestProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pasteText, setPasteText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const hasNotes = rawText.trim().length > 0;

  const uploadFile = useCallback(
    (file: File) => {
      if (file.size > MAX_UPLOAD_BYTES) {
        toast.error("File is too large. Maximum size is 10MB.");
        return;
      }

      setSelectedFileName(file.name);
      const formData = new FormData();
      formData.set("studySetId", studySetId);
      formData.set("file", file);

      startTransition(async () => {
        const result = await uploadNotesAction(formData);
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success(
          `Extracted ${result.data.characterCount.toLocaleString()} characters from ${result.data.sourceType.toUpperCase()}`
        );
        setSelectedFileName(null);
        router.refresh();
      });
    },
    [router, studySetId]
  );

  function handlePasteSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await pasteNotesAction({
        studySetId,
        text: pasteText,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `Saved ${result.data.characterCount.toLocaleString()} characters`
      );
      setPasteText("");
      router.refresh();
    });
  }

  function handleClear() {
    startTransition(async () => {
      const result = await clearNotesAction(studySetId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Notes cleared");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add study notes</CardTitle>
          <CardDescription>
            Upload a PDF, DOCX, or TXT file (max 10MB), or paste text. Text is
            extracted on the server and saved to this study set.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload file</TabsTrigger>
              <TabsTrigger value="paste">Paste text</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4 pt-4">
              <div
                role="button"
                tabIndex={0}
                aria-label="Upload study notes file"
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    inputRef.current?.click();
                  }
                }}
                onClick={() => inputRef.current?.click()}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                  const file = event.dataTransfer.files?.[0];
                  if (file) uploadFile(file);
                }}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center transition-colors",
                  isDragging
                    ? "border-foreground bg-muted/60"
                    : "border-muted-foreground/30 hover:bg-muted/40",
                  isPending && "pointer-events-none opacity-60"
                )}
              >
                <FileUp className="mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">
                  Drag and drop a file here, or click to browse
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  PDF, DOCX, or TXT · up to {formatBytes(MAX_UPLOAD_BYTES)}
                </p>
                {selectedFileName ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Selected: {selectedFileName}
                  </p>
                ) : null}
              </div>

              <input
                ref={inputRef}
                type="file"
                accept={ALLOWED_UPLOAD_ACCEPT}
                className="sr-only"
                disabled={isPending}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) uploadFile(file);
                  event.target.value = "";
                }}
              />

              {isPending ? (
                <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extracting text…
                </p>
              ) : null}
            </TabsContent>

            <TabsContent value="paste" className="pt-4">
              <form onSubmit={handlePasteSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paste-notes">Paste your notes</Label>
                  <Textarea
                    id="paste-notes"
                    value={pasteText}
                    onChange={(event) => setPasteText(event.target.value)}
                    placeholder="Paste lecture notes, reading excerpts, or study material…"
                    className="min-h-[220px]"
                    disabled={isPending}
                  />
                  <p className="text-xs text-muted-foreground">
                    {pasteText.trim().length.toLocaleString()} characters
                  </p>
                </div>
                <Button type="submit" disabled={isPending || !pasteText.trim()}>
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Save pasted text
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Stored notes</CardTitle>
            <CardDescription>
              {hasNotes
                ? `Source: ${sourceType} · ${rawText.length.toLocaleString()} characters`
                : "No notes stored yet."}
            </CardDescription>
          </div>
          {hasNotes ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Clear
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {hasNotes ? (
            <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-sm leading-relaxed">
              {rawText}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">
              Upload or paste notes to continue to summaries, flashcards, quizzes,
              and chat in later phases.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
