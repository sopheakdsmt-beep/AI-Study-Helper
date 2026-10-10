-- StudyHelper initial schema + Row Level Security
-- Apply in Supabase SQL Editor or via `supabase db push`

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
do $$ begin
  create type public.source_type as enum ('empty', 'pdf', 'docx', 'txt', 'paste');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.study_language as enum ('en', 'km');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.summary_mode as enum ('short', 'detailed', 'bullets');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.flashcard_status as enum ('known', 'learning');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.chat_role as enum ('user', 'assistant');
exception when duplicate_object then null;
end $$;

-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- study_sets
create table if not exists public.study_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  source_type public.source_type not null default 'empty',
  raw_text text not null default '',
  language public.study_language not null default 'en',
  created_at timestamptz not null default now()
);

create index if not exists study_sets_user_id_idx on public.study_sets (user_id);
create index if not exists study_sets_created_at_idx on public.study_sets (created_at desc);

-- summaries
create table if not exists public.summaries (
  id uuid primary key default gen_random_uuid(),
  study_set_id uuid not null references public.study_sets (id) on delete cascade,
  mode public.summary_mode not null,
  content text not null,
  created_at timestamptz not null default now(),
  unique (study_set_id, mode)
);

create index if not exists summaries_study_set_id_idx on public.summaries (study_set_id);

-- flashcards
create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  study_set_id uuid not null references public.study_sets (id) on delete cascade,
  front text not null,
  back text not null,
  status public.flashcard_status not null default 'learning',
  times_seen integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists flashcards_study_set_id_idx on public.flashcards (study_set_id);

-- quizzes
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  study_set_id uuid not null references public.study_sets (id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now()
);

create index if not exists quizzes_study_set_id_idx on public.quizzes (study_set_id);

-- quiz_questions
create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  question text not null,
  options jsonb not null,
  correct_index integer not null check (correct_index >= 0 and correct_index <= 3),
  explanation text not null
);

create index if not exists quiz_questions_quiz_id_idx on public.quiz_questions (quiz_id);

-- quiz_attempts
create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  score integer not null,
  total integer not null,
  answers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists quiz_attempts_quiz_id_idx on public.quiz_attempts (quiz_id);
create index if not exists quiz_attempts_user_id_idx on public.quiz_attempts (user_id);

-- chat_messages
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  study_set_id uuid not null references public.study_sets (id) on delete cascade,
  role public.chat_role not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_study_set_id_idx on public.chat_messages (study_set_id);

-- Helper: does the current user own this study set?
create or replace function public.owns_study_set(set_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.study_sets s
    where s.id = set_id
      and s.user_id = auth.uid()
  );
$$;

-- Helper: does the current user own this quiz (via study set)?
create or replace function public.owns_quiz(target_quiz_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.quizzes q
    join public.study_sets s on s.id = q.study_set_id
    where q.id = target_quiz_id
      and s.user_id = auth.uid()
  );
$$;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for existing users
insert into public.profiles (id, display_name)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'display_name', split_part(u.email, '@', 1))
from auth.users u
on conflict (id) do nothing;

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.study_sets enable row level security;
alter table public.summaries enable row level security;
alter table public.flashcards enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.chat_messages enable row level security;

-- profiles policies
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- study_sets policies
drop policy if exists "study_sets_select_own" on public.study_sets;
create policy "study_sets_select_own"
  on public.study_sets for select
  using (auth.uid() = user_id);

drop policy if exists "study_sets_insert_own" on public.study_sets;
create policy "study_sets_insert_own"
  on public.study_sets for insert
  with check (auth.uid() = user_id);

drop policy if exists "study_sets_update_own" on public.study_sets;
create policy "study_sets_update_own"
  on public.study_sets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "study_sets_delete_own" on public.study_sets;
create policy "study_sets_delete_own"
  on public.study_sets for delete
  using (auth.uid() = user_id);

-- summaries policies (via study_set ownership)
drop policy if exists "summaries_select_own" on public.summaries;
create policy "summaries_select_own"
  on public.summaries for select
  using (public.owns_study_set(study_set_id));

drop policy if exists "summaries_insert_own" on public.summaries;
create policy "summaries_insert_own"
  on public.summaries for insert
  with check (public.owns_study_set(study_set_id));

drop policy if exists "summaries_update_own" on public.summaries;
create policy "summaries_update_own"
  on public.summaries for update
  using (public.owns_study_set(study_set_id))
  with check (public.owns_study_set(study_set_id));

drop policy if exists "summaries_delete_own" on public.summaries;
create policy "summaries_delete_own"
  on public.summaries for delete
  using (public.owns_study_set(study_set_id));

-- flashcards policies
drop policy if exists "flashcards_select_own" on public.flashcards;
create policy "flashcards_select_own"
  on public.flashcards for select
  using (public.owns_study_set(study_set_id));

drop policy if exists "flashcards_insert_own" on public.flashcards;
create policy "flashcards_insert_own"
  on public.flashcards for insert
  with check (public.owns_study_set(study_set_id));

drop policy if exists "flashcards_update_own" on public.flashcards;
create policy "flashcards_update_own"
  on public.flashcards for update
  using (public.owns_study_set(study_set_id))
  with check (public.owns_study_set(study_set_id));

drop policy if exists "flashcards_delete_own" on public.flashcards;
create policy "flashcards_delete_own"
  on public.flashcards for delete
  using (public.owns_study_set(study_set_id));

-- quizzes policies
drop policy if exists "quizzes_select_own" on public.quizzes;
create policy "quizzes_select_own"
  on public.quizzes for select
  using (public.owns_study_set(study_set_id));

drop policy if exists "quizzes_insert_own" on public.quizzes;
create policy "quizzes_insert_own"
  on public.quizzes for insert
  with check (public.owns_study_set(study_set_id));

drop policy if exists "quizzes_update_own" on public.quizzes;
create policy "quizzes_update_own"
  on public.quizzes for update
  using (public.owns_study_set(study_set_id))
  with check (public.owns_study_set(study_set_id));

drop policy if exists "quizzes_delete_own" on public.quizzes;
create policy "quizzes_delete_own"
  on public.quizzes for delete
  using (public.owns_study_set(study_set_id));

-- quiz_questions policies
drop policy if exists "quiz_questions_select_own" on public.quiz_questions;
create policy "quiz_questions_select_own"
  on public.quiz_questions for select
  using (public.owns_quiz(quiz_id));

drop policy if exists "quiz_questions_insert_own" on public.quiz_questions;
create policy "quiz_questions_insert_own"
  on public.quiz_questions for insert
  with check (public.owns_quiz(quiz_id));

drop policy if exists "quiz_questions_update_own" on public.quiz_questions;
create policy "quiz_questions_update_own"
  on public.quiz_questions for update
  using (public.owns_quiz(quiz_id))
  with check (public.owns_quiz(quiz_id));

drop policy if exists "quiz_questions_delete_own" on public.quiz_questions;
create policy "quiz_questions_delete_own"
  on public.quiz_questions for delete
  using (public.owns_quiz(quiz_id));

-- quiz_attempts policies
drop policy if exists "quiz_attempts_select_own" on public.quiz_attempts;
create policy "quiz_attempts_select_own"
  on public.quiz_attempts for select
  using (auth.uid() = user_id and public.owns_quiz(quiz_id));

drop policy if exists "quiz_attempts_insert_own" on public.quiz_attempts;
create policy "quiz_attempts_insert_own"
  on public.quiz_attempts for insert
  with check (auth.uid() = user_id and public.owns_quiz(quiz_id));

drop policy if exists "quiz_attempts_delete_own" on public.quiz_attempts;
create policy "quiz_attempts_delete_own"
  on public.quiz_attempts for delete
  using (auth.uid() = user_id);

-- chat_messages policies
drop policy if exists "chat_messages_select_own" on public.chat_messages;
create policy "chat_messages_select_own"
  on public.chat_messages for select
  using (public.owns_study_set(study_set_id));

drop policy if exists "chat_messages_insert_own" on public.chat_messages;
create policy "chat_messages_insert_own"
  on public.chat_messages for insert
  with check (public.owns_study_set(study_set_id));

drop policy if exists "chat_messages_delete_own" on public.chat_messages;
create policy "chat_messages_delete_own"
  on public.chat_messages for delete
  using (public.owns_study_set(study_set_id));
