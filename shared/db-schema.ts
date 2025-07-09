import { sql } from "drizzle-orm";
import { pgTable, uuid, text, json, real, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Training images table as specified in the prompt
export const trainingImages = pgTable("training_images", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  labelType: text("label_type").notNull(), // 'crack', 'porosity', 'slag', 'clean', etc.
  bbox: json("bbox").$type<{ x: number; y: number; width: number; height: number }>(),
  confidence: real("confidence"),
  imageType: text("image_type").notNull(), // 'xray' or 'normal'
  savedToDataset: boolean("saved_to_dataset").default(false),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  originalPath: text("original_path"), // Path to original image
  datasetPath: text("dataset_path"), // Path in dataset structure
  labelPath: text("label_path"), // Path to YOLO label file
});

// Analysis results table for storing detection results
export const analysisResults = pgTable("analysis_results", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  imageType: text("image_type").notNull(), // 'xray' or 'normal'
  detections: json("detections").$type<Array<{
    class: string;
    confidence: number;
    bbox: { x: number; y: number; width: number; height: number };
    center: { x: number; y: number };
  }>>(),
  summary: json("summary").$type<{
    total_defects: number;
    defect_types: Record<string, number>;
    average_confidence: number;
    processing_time: number;
  }>(),
  imageInfo: json("image_info").$type<{
    filename: string;
    width: number;
    height: number;
    format: string;
    size_bytes: number;
  }>(),
  claheApplied: boolean("clahe_applied").default(false),
  processingMode: text("processing_mode").default('standard'), // 'standard', 'enhanced', 'high_sensitivity'
  createdAt: timestamp("created_at").defaultNow(),
});

// Models table for tracking trained models
export const models = pgTable("models", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  version: text("version").notNull(),
  modelPath: text("model_path").notNull(),
  trainingDatasetId: text("training_dataset_id"),
  metrics: json("metrics").$type<{
    precision: number;
    recall: number;
    f1_score: number;
    map: number; // mean average precision
  }>(),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Training datasets table
export const trainingDatasets = pgTable("training_datasets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  imageCount: integer("image_count").default(0),
  labelCount: integer("label_count").default(0),
  datasetPath: text("dataset_path").notNull(),
  status: text("status").default('preparing'), // 'preparing', 'ready', 'training', 'completed'
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema for inserts
export const insertTrainingImageSchema = createInsertSchema(trainingImages).omit({
  id: true,
  uploadedAt: true,
});

export const insertAnalysisResultSchema = createInsertSchema(analysisResults).omit({
  id: true,
  createdAt: true,
});

export const insertModelSchema = createInsertSchema(models).omit({
  id: true,
  createdAt: true,
});

export const insertTrainingDatasetSchema = createInsertSchema(trainingDatasets).omit({
  id: true,
  createdAt: true,
});

// Types
export type TrainingImage = typeof trainingImages.$inferSelect;
export type InsertTrainingImage = z.infer<typeof insertTrainingImageSchema>;

export type AnalysisResult = typeof analysisResults.$inferSelect;
export type InsertAnalysisResult = z.infer<typeof insertAnalysisResultSchema>;

export type Model = typeof models.$inferSelect;
export type InsertModel = z.infer<typeof insertModelSchema>;

export type TrainingDataset = typeof trainingDatasets.$inferSelect;
export type InsertTrainingDataset = z.infer<typeof insertTrainingDatasetSchema>;