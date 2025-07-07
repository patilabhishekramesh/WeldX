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

      // Use the Python backend on port 8000
      const response = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setStatus("Processing with AI model...");
      setProgress(60);

      const result = await response.json();
      
      setStatus("Finalizing results...");
      setProgress(100);

      setTimeout(() => {
        onAnalysisComplete(result);
        setProgress(0);
        setStatus("Initializing...");
      }, 500);

    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis failed",
        description: "Unable to process the image. Please try again.",
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
