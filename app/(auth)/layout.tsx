import { BookOpen } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-muted/40">
      <div className="flex items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2 font-semibold">
          <BookOpen className="h-5 w-5" aria-hidden />
          <span>StudyHelper</span>
        </div>
        <ThemeToggle />
      </div>
      <main className="flex flex-1 items-center justify-center px-4 pb-12">
        {children}
      </main>
    </div>
  );
}
