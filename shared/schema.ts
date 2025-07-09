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

// File upload validation schema with DICOM support
export const uploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, "File size must be less than 10MB")
    .refine(
      (file) => {
        const supportedTypes = [
          "image/jpeg", 
          "image/png", 
          "image/jpg",
          "application/dicom",
          "application/octet-stream" // DICOM files sometimes show as this
        ];
        return supportedTypes.includes(file.type) || file.name.toLowerCase().endsWith('.dcm');
      },
      "Only JPEG, PNG, and DICOM files are supported"
    ),
});

// Image mode schema
export const imageModeSchema = z.enum(['xray', 'normal']);

// Enhanced analysis request schema
export const analysisRequestSchema = z.object({
  imageMode: imageModeSchema,
  enhancementMode: z.enum(['none', 'clahe', 'advanced']).default('none'),
  saveToDataset: z.boolean().default(false),
  confidenceThreshold: z.number().min(0).max(1).default(0.5),
});

// Training image schema
export const trainingImageSchema = z.object({
  filename: z.string(),
  labelType: z.string(),
  bbox: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }).optional(),
  confidence: z.number().optional(),
  imageType: imageModeSchema,
  savedToDataset: z.boolean().default(false),
  originalPath: z.string().optional(),
  datasetPath: z.string().optional(),
  labelPath: z.string().optional(),
});

export type DetectionResult = z.infer<typeof detectionResultSchema>;
export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;
export type UploadRequest = z.infer<typeof uploadSchema>;
export type ImageMode = z.infer<typeof imageModeSchema>;
export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;
export type TrainingImage = z.infer<typeof trainingImageSchema>;
