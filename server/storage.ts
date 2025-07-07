import type { AnalysisResponse } from "@shared/schema";

// Storage interface for welding defect detection system
export interface IStorage {
  saveAnalysisResult(result: AnalysisResponse): Promise<void>;
  getAnalysisHistory(): Promise<AnalysisResponse[]>;
}

export class MemStorage implements IStorage {
  private analysisHistory: AnalysisResponse[] = [];

  async saveAnalysisResult(result: AnalysisResponse): Promise<void> {
    this.analysisHistory.push(result);
  }

  async getAnalysisHistory(): Promise<AnalysisResponse[]> {
    return [...this.analysisHistory];
  }
}

export const storage = new MemStorage();
