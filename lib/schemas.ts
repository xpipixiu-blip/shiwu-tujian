import { z } from "zod";

export const numericStatSchema = z.object({
  type: z.literal("numeric"),
  label: z.string().min(1).max(6),
  value: z.string().min(1).max(8),
  score: z.number().min(0).max(100),
});

export const textStatSchema = z.object({
  type: z.literal("text"),
  label: z.string().min(1).max(6),
  value: z.string().min(1).max(10),
});

export const atlasCardContentSchema = z.object({
  fantasyName: z.string().min(2).max(12),
  description: z.string().min(1).max(60),
  stats: z
    .array(z.union([numericStatSchema, textStatSchema]))
    .length(3)
    .refine(
      (arr) => {
        const numCount = arr.filter((s) => s.type === "numeric").length;
        const textCount = arr.filter((s) => s.type === "text").length;
        return numCount === 2 && textCount === 1;
      },
      { message: "需要恰好 2 条 numeric 和 1 条 text 属性" }
    ),
  funFact: z.string().min(1).max(40),
});

export const analysisResultSchema = z.object({
  objectName: z.string().min(1).max(40),
  category: z.string().min(1),
});

export const subjectBoxSchema = z.object({
  centerX: z.number().min(0).max(1000),
  centerY: z.number().min(0).max(1000),
  width: z.number().min(10).max(1000),
  height: z.number().min(10).max(1000),
});

export type AtlasCardContent = z.infer<typeof atlasCardContentSchema>;
export type AnalysisResult = z.infer<typeof analysisResultSchema>;
export type SubjectBox = z.infer<typeof subjectBoxSchema>;
