import type { AnalysisResponse } from "@shared/schema";
import { 
  db, 
  analysisResults, 
  trainingImages, 
  models,
  trainingDatasets,
  type InsertAnalysisResult,
  type InsertTrainingImage,
  type InsertModel,
  type InsertTrainingDataset 
} from "./db";
import { eq, desc } from "drizzle-orm";

// Enhanced storage interface for welding defect detection system
export interface IStorage {
  // Analysis results
  saveAnalysisResult(result: AnalysisResponse, imageType: 'xray' | 'normal', claheApplied?: boolean): Promise<void>;
  getAnalysisHistory(): Promise<AnalysisResponse[]>;
  
  // Training images
  saveTrainingImage(image: InsertTrainingImage): Promise<string>;
  getTrainingImages(): Promise<Array<{
    id: string;
    filename: string;
    labelType: string;
    bbox: { x: number; y: number; width: number; height: number } | null;
    confidence: number | null;
    imageType: string;
    savedToDataset: boolean | null;
    uploadedAt: Date | null;
  }>>;
  
  // Models
  saveModel(model: InsertModel): Promise<string>;
  getModels(): Promise<Array<{
    id: string;
    name: string;
    version: string;
    modelPath: string;
    isActive: boolean | null;
    createdAt: Date | null;
  }>>;
  activateModel(modelId: string): Promise<void>;
  
  // Training datasets
  createTrainingDataset(dataset: InsertTrainingDataset): Promise<string>;
  getTrainingDatasets(): Promise<Array<{
    id: string;
    name: string;
    description: string | null;
    imageCount: number | null;
    labelCount: number | null;
    status: string | null;
    createdAt: Date | null;
  }>>;
}

export class PostgresStorage implements IStorage {
  async saveAnalysisResult(result: AnalysisResponse, imageType: 'xray' | 'normal', claheApplied: boolean = false): Promise<void> {
    let detections = null;
    if (result.detections && Array.isArray(result.detections)) {
      detections = result.detections.map(d => ({
        class: d.class,
        confidence: d.confidence,
        bbox: d.bbox,
        center: d.center
      }));
    }

    try {
      await db.insert(analysisResults).values({
        filename: result.image_info.filename,
        imageType,
        detections,
        summary: result.summary,
        imageInfo: result.image_info,
        claheApplied,
        processingMode: 'standard',
      });
    } catch (error) {
      console.error('Database insert error:', error);
      // Fallback to memory storage on error
      throw error;
    }
  }

  async getAnalysisHistory(): Promise<AnalysisResponse[]> {
    const results = await db
      .select()
      .from(analysisResults)
      .orderBy(desc(analysisResults.createdAt))
      .limit(50);
    
    return results.map(result => ({
      success: true,
      message: "Analysis completed successfully",
      image_info: result.imageInfo!,
      detections: result.detections || [],
      summary: result.summary!,
    }));
  }

  async saveTrainingImage(image: InsertTrainingImage): Promise<string> {
    const result = await db.insert(trainingImages).values(image).returning({ id: trainingImages.id });
    return result[0].id;
  }

  async getTrainingImages() {
    return await db.select({
      id: trainingImages.id,
      filename: trainingImages.filename,
      labelType: trainingImages.labelType,
      bbox: trainingImages.bbox,
      confidence: trainingImages.confidence,
      imageType: trainingImages.imageType,
      savedToDataset: trainingImages.savedToDataset,
      uploadedAt: trainingImages.uploadedAt,
    }).from(trainingImages).orderBy(desc(trainingImages.uploadedAt));
  }

  async saveModel(model: InsertModel): Promise<string> {
    const result = await db.insert(models).values(model).returning({ id: models.id });
    return result[0].id;
  }

  async getModels() {
    return await db.select({
      id: models.id,
      name: models.name,
      version: models.version,
      modelPath: models.modelPath,
      isActive: models.isActive,
      createdAt: models.createdAt,
    }).from(models).orderBy(desc(models.createdAt));
  }

  async activateModel(modelId: string): Promise<void> {
    // Deactivate all models first
    await db.update(models).set({ isActive: false });
    
    // Activate the selected model
    await db.update(models).set({ isActive: true }).where(eq(models.id, modelId));
  }

  async createTrainingDataset(dataset: InsertTrainingDataset): Promise<string> {
    const result = await db.insert(trainingDatasets).values(dataset).returning({ id: trainingDatasets.id });
    return result[0].id;
  }

  async getTrainingDatasets() {
    return await db.select({
      id: trainingDatasets.id,
      name: trainingDatasets.name,
      description: trainingDatasets.description,
      imageCount: trainingDatasets.imageCount,
      labelCount: trainingDatasets.labelCount,
      status: trainingDatasets.status,
      createdAt: trainingDatasets.createdAt,
    }).from(trainingDatasets).orderBy(desc(trainingDatasets.createdAt));
  }
}

export class MemStorage implements IStorage {
  private analysisHistory: AnalysisResponse[] = [];
  private trainingImages: any[] = [];
  private models: any[] = [];
  private trainingDatasets: any[] = [];

  async saveAnalysisResult(result: AnalysisResponse, imageType: 'xray' | 'normal', claheApplied: boolean = false): Promise<void> {
    this.analysisHistory.push(result);
  }

  async getAnalysisHistory(): Promise<AnalysisResponse[]> {
    return [...this.analysisHistory];
  }

  async saveTrainingImage(image: InsertTrainingImage): Promise<string> {
    const id = crypto.randomUUID();
    this.trainingImages.push({ id, ...image, uploadedAt: new Date() });
    return id;
  }

  async getTrainingImages() {
    return this.trainingImages;
  }

  async saveModel(model: InsertModel): Promise<string> {
    const id = crypto.randomUUID();
    this.models.push({ id, ...model, createdAt: new Date() });
    return id;
  }

  async getModels() {
    return this.models;
  }

  async activateModel(modelId: string): Promise<void> {
    this.models.forEach(model => {
      model.isActive = model.id === modelId;
    });
  }

  async createTrainingDataset(dataset: InsertTrainingDataset): Promise<string> {
    const id = crypto.randomUUID();
    this.trainingDatasets.push({ id, ...dataset, createdAt: new Date() });
    return id;
  }

  async getTrainingDatasets() {
    return this.trainingDatasets;
  }
}

// Use PostgreSQL storage now that database is set up
export const storage = new PostgresStorage();
