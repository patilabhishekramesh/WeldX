import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { AnalysisResponse, ImageMode } from "@shared/schema";

interface AnalysisOptions {
  imageMode: ImageMode;
  enhancementMode: 'none' | 'clahe' | 'advanced';
  saveToDataset: boolean;
  confidenceThreshold: number;
}

interface ProcessingModalProps {
  isOpen: boolean;
  onAnalysisComplete: (result: AnalysisResponse) => void;
  uploadedFile: File | null;
  analysisOptions?: AnalysisOptions;
}

export default function ProcessingModal({ 
  isOpen, 
  onAnalysisComplete, 
  uploadedFile,
  analysisOptions
}: ProcessingModalProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Initializing...");
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && uploadedFile) {
      processImage();
    }
  }, [isOpen, uploadedFile]);

  const processImage = async () => {
    if (!uploadedFile) return;

    try {
      setStatus("Preparing image...");
      setProgress(20);

      const formData = new FormData();
      formData.append('file', uploadedFile);
      
      // Add analysis options if provided
      if (analysisOptions) {
        formData.append('imageMode', analysisOptions.imageMode);
        formData.append('enhancementMode', analysisOptions.enhancementMode);
        formData.append('saveToDataset', analysisOptions.saveToDataset.toString());
        formData.append('confidenceThreshold', analysisOptions.confidenceThreshold.toString());
      }

      const statusMessage = analysisOptions?.enhancementMode === 'clahe' 
        ? "Processing with CLAHE enhancement..." 
        : "Processing with AI engine...";
      
      setStatus(statusMessage);
      setProgress(50);
      
      console.log('Making API call to /api/analyze...');
      
      // Try the enhanced API endpoint first, then fallback
      let response;
      try {
        response = await fetch('/api/analyze', {
          method: 'POST',
          body: formData
        });
      } catch (error) {
        console.log('Enhanced API failed, falling back to /api/analyze-fallback...');
        response = await fetch('/api/analyze-fallback', {
          method: 'POST',
          body: formData
        });
      }

      console.log('Response received:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', response.status, errorText);
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }

      setStatus("Analyzing results...");
      setProgress(75);

      const result = await response.json();
      console.log('Analysis result:', result);
      
      if (!result.success) {
        throw new Error(result.message || 'Analysis failed on server');
      }

      setStatus("Finalizing...");
      setProgress(90);

      // Simple validation
      if (!result.detections || !result.summary || !result.image_info) {
        console.error('Invalid response structure:', result);
        throw new Error('Server returned incomplete data');
      }

      setProgress(100);

      setTimeout(() => {
        console.log('Calling onAnalysisComplete with result');
        onAnalysisComplete(result);
        setProgress(0);
        setStatus("Initializing...");
      }, 800);

    } catch (error) {
      console.error('Error in processImage:', error);
      
      // Don't show confusing error messages - keep it simple
      const errorMessage = "Image analysis could not be completed. Please try uploading the image again.";
      
      toast({
        title: "Processing Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      setProgress(0);
      setStatus("Initializing...");
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <div className="text-center py-6">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Processing Image</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {status}
          </p>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Estimated time: 2-5 seconds
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
