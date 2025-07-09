import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { 
  trainingImages, 
  analysisResults, 
  models, 
  trainingDatasets,
  type InsertTrainingImage,
  type InsertAnalysisResult,
  type InsertModel,
  type InsertTrainingDataset 
} from "@shared/db-schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql);

// Export all tables and types for easy access
export {
  trainingImages,
  analysisResults,
  models,
  trainingDatasets,
  type InsertTrainingImage,
  type InsertAnalysisResult,
  type InsertModel,
  type InsertTrainingDataset,
};