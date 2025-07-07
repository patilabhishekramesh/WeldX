import { z } from "zod";

// Detection result schema
export const detectionResultSchema = z.object({
  class: z.string(),
  confidence: z.number(),
  bbox: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }),
  center: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

// Analysis response schema
export const analysisResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  image_info: z.object({
    filename: z.string(),
    width: z.number(),
    height: z.number(),
    format: z.string(),
    size_bytes: z.number(),
  }),
  detections: z.array(detectionResultSchema),
  summary: z.object({
    total_defects: z.number(),
    defect_types: z.record(z.number()),
    average_confidence: z.number(),
    processing_time: z.number(),
  }),
});

// File upload validation schema
export const uploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, "File size must be less than 10MB")
    .refine(
      (file) => ["image/jpeg", "image/png", "image/jpg"].includes(file.type),
      "Only JPEG and PNG files are supported"
    ),
});

export type DetectionResult = z.infer<typeof detectionResultSchema>;
export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;
export type UploadRequest = z.infer<typeof uploadSchema>;
