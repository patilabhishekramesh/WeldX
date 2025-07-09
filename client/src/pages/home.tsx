import { useState } from "react";
import { Shield, Settings, Cog, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import EnhancedUploadZone from "@/components/enhanced-upload-zone";
import ImageAnalysis from "@/components/image-analysis";
import ResultsPanel from "@/components/results-panel";
import ProcessingModal from "@/components/processing-modal";
import AdvancedSettings from "@/components/advanced-settings";
import TrainingPanel from "@/components/training-panel";
import type { AnalysisResponse, ImageMode } from "@shared/schema";

interface AnalysisOptions {
  imageMode: ImageMode;
  enhancementMode: 'none' | 'clahe' | 'advanced';
  saveToDataset: boolean;
  confidenceThreshold: number;
}

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showTrainingPanel, setShowTrainingPanel] = useState(false);
  const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptions | null>(null);

  const handleFileUpload = (file: File, options: AnalysisOptions) => {
    setUploadedFile(file);
    setAnalysisOptions(options);
    setAnalysisResult(null);
    
    // Create image preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalysisResult = (result: AnalysisResponse) => {
    setAnalysisResult(result);
    setIsProcessing(false);
  };

  const handleProcessingStart = () => {
    setIsProcessing(true);
  };

  const handleNewAnalysis = () => {
    setUploadedFile(null);
    setAnalysisResult(null);
    setImagePreview(null);
    setIsProcessing(false);
  };

  return (
    <div className="bg-background-light min-h-screen">
      {/* Header */}
      <header className="bg-surface elevation-1 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="text-white w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">AI Welding Defect Detection</h1>
                <p className="text-sm text-muted-foreground">Radiographic Analysis System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                AI System Ready
              </div>
              <Button 
                variant="outline" 
                className="border-orange-200 text-orange-700 hover:bg-orange-50"
                onClick={() => setShowTrainingPanel(true)}
              >
                <GraduationCap className="mr-2 w-4 h-4" />
                Train Model
              </Button>
              <Button 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => setShowAdvancedSettings(true)}
              >
                <Cog className="mr-2 w-4 h-4" />
                Advanced
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload and Analysis Section */}
          <div className="lg:col-span-2 space-y-6">
            <EnhancedUploadZone 
              onFileUpload={handleFileUpload}
              onProcessingStart={handleProcessingStart}
            />
            
            {imagePreview && (
              <ImageAnalysis
                imagePreview={imagePreview}
                analysisResult={analysisResult}
                isProcessing={isProcessing}
              />
            )}
          </div>

          {/* Results Panel */}
          <div className="space-y-6">
            <ResultsPanel 
              analysisResult={analysisResult}
              onNewAnalysis={handleNewAnalysis}
            />
          </div>
        </div>
      </main>

      {/* Processing Modal */}
      <ProcessingModal 
        isOpen={isProcessing}
        onAnalysisComplete={handleAnalysisResult}
        uploadedFile={uploadedFile}
        analysisOptions={analysisOptions}
      />

      {/* Advanced Settings Modal */}
      <AdvancedSettings
        isOpen={showAdvancedSettings}
        onClose={() => setShowAdvancedSettings(false)}
      />

      {/* Training Panel Modal */}
      <TrainingPanel
        isOpen={showTrainingPanel}
        onClose={() => setShowTrainingPanel(false)}
      />
    </div>
  );
}
