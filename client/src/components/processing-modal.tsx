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

      // Try multiple backend endpoints with proper error handling
      const backendUrls = [
        '/api/analyze-fallback',  // Primary: Node.js backend (always available)
        'http://localhost:8000/api/analyze'  // Secondary: Python AI backend
      ];

      let response = null;
      let lastError = null;

      for (const url of backendUrls) {
        try {
          const backendType = url.includes('8000') ? 'Python AI' : 'Node.js';
          setStatus(`Connecting to ${backendType} backend...`);
          
          const timeoutController = new AbortController();
          const timeoutId = setTimeout(() => timeoutController.abort(), 15000); // 15 second timeout
          
          response = await fetch(url, {
            method: 'POST',
            body: formData,
            signal: timeoutController.signal
          });
          
          clearTimeout(timeoutId);

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
      
      let errorMessage = "Analysis could not be completed. Please try again.";
      
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        errorMessage = "Analysis timed out. Please try with a smaller image or wait a moment.";
      } else if (error.message.includes('Failed to fetch') || error.message.includes('Could not connect')) {
        errorMessage = "Connection issue detected. The system will automatically retry with backup servers.";
      } else if (error.message.includes('HTTP 413') || error.message.includes('too large')) {
        errorMessage = "Image file is too large. Please use an image under 10MB.";
      } else if (error.message.includes('HTTP 400')) {
        errorMessage = "Please upload a valid JPEG or PNG X-ray image.";
      } else if (error.message.includes('All backends failed')) {
        errorMessage = "All analysis servers are temporarily unavailable. Please try again in a moment.";
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
