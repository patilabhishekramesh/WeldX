import { useState, useCallback, useRef } from "react";
import { CloudUpload, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { uploadSchema } from "@shared/schema";

interface UploadZoneProps {
  onFileUpload: (file: File) => void;
  onProcessingStart: () => void;
}

export default function UploadZone({ onFileUpload, onProcessingStart }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateAndProcessFile = useCallback((file: File) => {
    try {
      uploadSchema.parse({ file });
      onFileUpload(file);
      onProcessingStart();
      toast({
        title: "File uploaded successfully",
        description: `${file.name} is ready for analysis`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Please check file size (max 10MB) and format (JPEG/PNG)",
        variant: "destructive",
      });
    }
  }, [onFileUpload, onProcessingStart, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      validateAndProcessFile(files[0]);
    }
  }, [validateAndProcessFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndProcessFile(files[0]);
    }
  }, [validateAndProcessFile]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="elevation-2 overflow-hidden">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center">
          <Upload className="text-primary mr-2 w-5 h-5" />
          Upload X-Ray Image
        </CardTitle>
        <CardDescription>
          Upload radiographic images for defect analysis
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragOver 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary hover:bg-primary/5"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          <div className="space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <CloudUpload className="text-muted-foreground w-8 h-8" />
            </div>
            <div>
              <p className="text-lg font-medium text-foreground">Drop your X-ray image here</p>
              <p className="text-sm text-muted-foreground">or click to browse files</p>
            </div>
            <div className="flex justify-center">
              <Button className="bg-primary text-primary-foreground hover:bg-primary-dark">
                Select File
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Supported formats: JPEG, PNG • Max size: 10MB
            </div>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          onChange={handleFileSelect}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
