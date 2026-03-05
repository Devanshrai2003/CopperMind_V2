import { z } from "zod";

export const memoryQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .refine((val) => val > 0 && val <= 50, {
      message: "Limit must be between 1 and 50",
    }),
  cursor: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      try {
        const parsed = JSON.parse(val);
        return {
          isPinned: parsed.isPinned,
          updatedAt: new Date(parsed.updatedAt),
          id: parsed.id,
        };
      } catch {
        return undefined;
      }
    }),
  isPinned: z
    .boolean()
    .optional()
    .transform((val) => (val !== undefined ? val === true : undefined)),
  type: z.enum(["NOTE", "LINK", "IMAGE", "DOC"]).optional(),
  tags: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",") : undefined)),
});

export const suggestTagsQuerySchema = z.object({
  title: z.string(),
  content: z.string().optional(),
});

export const createMemorySchema = z.object({
  type: z.enum(["NOTE", "LINK", "IMAGE", "DOC"]),
  title: z.string(),
  content: z.string().optional(),
  url: z.url().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateMemorySchema = z
  .object({
    title: z.string().optional(),
    content: z.string().optional(),
    url: z.url().optional(),
    tags: z.array(z.string()).optional(),
  })
  .strict();
