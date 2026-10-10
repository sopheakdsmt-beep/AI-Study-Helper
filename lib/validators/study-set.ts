import { z } from "zod";

export const createStudySetSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(120, "Title must be under 120 characters"),
  language: z.enum(["en", "km"], {
    message: "Choose English or Khmer",
  }),
});

export type CreateStudySetInput = z.infer<typeof createStudySetSchema>;
