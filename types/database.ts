export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SourceType = "empty" | "pdf" | "docx" | "txt" | "paste";
export type StudyLanguage = "en" | "km";
export type SummaryMode = "short" | "detailed" | "bullets";
export type FlashcardStatus = "known" | "learning";
export type ChatRole = "user" | "assistant";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      study_sets: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          source_type: SourceType;
          raw_text: string;
          language: StudyLanguage;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          source_type?: SourceType;
          raw_text?: string;
          language?: StudyLanguage;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          source_type?: SourceType;
          raw_text?: string;
          language?: StudyLanguage;
          created_at?: string;
        };
        Relationships: [];
      };
      summaries: {
        Row: {
          id: string;
          study_set_id: string;
          mode: SummaryMode;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          study_set_id: string;
          mode: SummaryMode;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          study_set_id?: string;
          mode?: SummaryMode;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      flashcards: {
        Row: {
          id: string;
          study_set_id: string;
          front: string;
          back: string;
          status: FlashcardStatus;
          times_seen: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          study_set_id: string;
          front: string;
          back: string;
          status?: FlashcardStatus;
          times_seen?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          study_set_id?: string;
          front?: string;
          back?: string;
          status?: FlashcardStatus;
          times_seen?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      quizzes: {
        Row: {
          id: string;
          study_set_id: string;
          title: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          study_set_id: string;
          title: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          study_set_id?: string;
          title?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      quiz_questions: {
        Row: {
          id: string;
          quiz_id: string;
          question: string;
          options: Json;
          correct_index: number;
          explanation: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          question: string;
          options: Json;
          correct_index: number;
          explanation: string;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          question?: string;
          options?: Json;
          correct_index?: number;
          explanation?: string;
        };
        Relationships: [];
      };
      quiz_attempts: {
        Row: {
          id: string;
          quiz_id: string;
          user_id: string;
          score: number;
          total: number;
          answers: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          user_id: string;
          score: number;
          total: number;
          answers?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          user_id?: string;
          score?: number;
          total?: number;
          answers?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          study_set_id: string;
          role: ChatRole;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          study_set_id: string;
          role: ChatRole;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          study_set_id?: string;
          role?: ChatRole;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      owns_study_set: {
        Args: { set_id: string };
        Returns: boolean;
      };
      owns_quiz: {
        Args: { target_quiz_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      source_type: SourceType;
      study_language: StudyLanguage;
      summary_mode: SummaryMode;
      flashcard_status: FlashcardStatus;
      chat_role: ChatRole;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type StudySet = Database["public"]["Tables"]["study_sets"]["Row"];
export type Summary = Database["public"]["Tables"]["summaries"]["Row"];
export type Flashcard = Database["public"]["Tables"]["flashcards"]["Row"];
export type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
export type QuizQuestion = Database["public"]["Tables"]["quiz_questions"]["Row"];
export type QuizAttempt = Database["public"]["Tables"]["quiz_attempts"]["Row"];
export type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];

export type StudySetWithCounts = StudySet & {
  summary_count: number;
  flashcard_count: number;
  quiz_count: number;
  chat_count: number;
};
