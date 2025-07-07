import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { AnalysisResponse } from "@shared/schema";

interface ProcessingModalProps {
  isOpen: boolean;
  onAnalysisComplete: (result: AnalysisResponse) => void;
  uploadedFile: File | null;
}

export default function ProcessingModal({ 
  isOpen, 
  onAnalysisComplete, 
  uploadedFile 
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
      setStatus("Uploading image...");
      setProgress(20);

      const formData = new FormData();
      formData.append('file', uploadedFile);

      setStatus("Connecting to AI backend...");
      setProgress(30);

      // Try multiple backend endpoints
      const backendUrls = [
        'http://localhost:8000/api/analyze',
        '/api/analyze-fallback'  // Fallback to Node.js backend
      ];

      let response = null;
      let lastError = null;

      for (const url of backendUrls) {
        try {
          setStatus(`Connecting to backend (${url.includes('8000') ? 'Python AI' : 'Node.js'})...`);
          
          response = await fetch(url, {
            method: 'POST',
            body: formData,
            signal: AbortSignal.timeout(30000) // 30 second timeout
          });

          if (response.ok) {
            break; // Success, exit loop
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (error) {
          lastError = error;
          console.warn(`Backend ${url} failed:`, error);
          continue; // Try next backend
        }
      }

      if (!response || !response.ok) {
        throw lastError || new Error('All backends failed');
      }

      setStatus("Processing with AI model...");
      setProgress(60);

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Analysis failed');
      }
      
      setStatus("Finalizing results...");
      setProgress(90);

      // Validate the response structure
      if (!result.detections || !result.summary || !result.image_info) {
        throw new Error('Invalid response format from backend');
      }

      setProgress(100);

      setTimeout(() => {
        onAnalysisComplete(result);
        setProgress(0);
        setStatus("Initializing...");
      }, 500);

    } catch (error) {
      console.error('Analysis failed:', error);
      
      let errorMessage = "Unable to process the image. Please try again.";
      
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        errorMessage = "Analysis timed out. The image might be too large or the server is busy.";
      } else if (error.message.includes('Failed to fetch') || error.message.includes('Could not connect')) {
        errorMessage = "Cannot connect to AI backend. Please check if the server is running.";
      } else if (error.message.includes('HTTP 413') || error.message.includes('too large')) {
        errorMessage = "Image file is too large. Please use a smaller image (max 10MB).";
      } else if (error.message.includes('HTTP 400')) {
        errorMessage = "Invalid image format. Please use JPEG or PNG files.";
      }
      
      toast({
        title: "Analysis failed",
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
