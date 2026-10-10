import Link from "next/link";
import { BookOpen } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import type { User } from "@supabase/supabase-js";

interface HeaderProps {
  user?: User | null;
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href={user ? "/dashboard" : "/"}
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <BookOpen className="h-5 w-5" aria-hidden />
          <span>StudyHelper</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? <UserMenu user={user} /> : null}
        </div>
      </div>
    </header>
  );
}
