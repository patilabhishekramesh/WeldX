import { useState, useCallback, useRef } from "react";
import { CloudUpload, Upload, Settings, Zap, Database, FileImage, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { uploadSchema, type ImageMode } from "@shared/schema";

interface EnhancedUploadZoneProps {
  onFileUpload: (file: File, options: AnalysisOptions) => void;
  onProcessingStart: () => void;
}

interface AnalysisOptions {
  imageMode: ImageMode;
  enhancementMode: 'none' | 'clahe' | 'advanced';
  saveToDataset: boolean;
  confidenceThreshold: number;
}

export default function EnhancedUploadZone({ onFileUpload, onProcessingStart }: EnhancedUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [imageMode, setImageMode] = useState<ImageMode>('xray');
  const [enhancementMode, setEnhancementMode] = useState<'none' | 'clahe' | 'advanced'>('none');
  const [saveToDataset, setSaveToDataset] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState([50]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateAndProcessFile = useCallback((file: File) => {
    try {
      uploadSchema.parse({ file });
      
      const options: AnalysisOptions = {
        imageMode,
        enhancementMode,
        saveToDataset,
        confidenceThreshold: confidenceThreshold[0] / 100,
      };
      
      onFileUpload(file, options);
      onProcessingStart();
      
      toast({
        title: "File uploaded successfully",
        description: `${file.name} is ready for ${imageMode === 'xray' ? 'X-ray' : 'normal'} analysis`,
      });
    } catch (error) {
      let errorMessage = "Please check file size (max 10MB) and format (JPEG/PNG/DICOM)";
      if (error.issues) {
        const sizeIssue = error.issues.find(i => i.message.includes('10MB'));
        const formatIssue = error.issues.find(i => i.message.includes('JPEG'));
        
        if (sizeIssue) {
          errorMessage = "File is too large. Maximum size is 10MB.";
        } else if (formatIssue) {
          errorMessage = "Invalid file format. Please use JPEG, PNG, or DICOM files.";
        }
      }
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [imageMode, enhancementMode, saveToDataset, confidenceThreshold, onFileUpload, onProcessingStart, toast]);

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
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Upload className="text-primary mr-2 w-5 h-5" />
            Upload {imageMode === 'xray' ? 'X-Ray' : 'Normal'} Image
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={imageMode === 'xray' ? 'default' : 'secondary'}>
              {imageMode === 'xray' ? 'X-Ray Mode' : 'Normal Mode'}
            </Badge>
            {enhancementMode === 'clahe' && (
              <Badge variant="outline">CLAHE Enhanced</Badge>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          Upload {imageMode === 'xray' ? 'radiographic' : 'RGB'} images for defect analysis
          {enhancementMode === 'clahe' && ' with contrast enhancement'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Image Mode Toggle */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-4">
            <FileImage className="w-5 h-5 text-muted-foreground" />
            <div>
              <Label className="text-sm font-medium">Image Type</Label>
              <p className="text-xs text-muted-foreground">
                {imageMode === 'xray' ? 'Radiographic X-ray images' : 'Normal RGB welding images'}
              </p>
            </div>
          </div>
          <Select value={imageMode} onValueChange={(value: ImageMode) => setImageMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="xray">X-Ray</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Enhancement Options */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-4">
            <Zap className="w-5 h-5 text-muted-foreground" />
            <div>
              <Label className="text-sm font-medium">Enhancement Mode</Label>
              <p className="text-xs text-muted-foreground">
                {enhancementMode === 'clahe' ? 'CLAHE contrast enhancement for better X-ray detection' : 'Standard processing'}
              </p>
            </div>
          </div>
          <Select value={enhancementMode} onValueChange={(value: 'none' | 'clahe' | 'advanced') => setEnhancementMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Standard</SelectItem>
              <SelectItem value="clahe">CLAHE</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Save to Dataset Toggle */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-4">
            <Database className="w-5 h-5 text-muted-foreground" />
            <div>
              <Label className="text-sm font-medium">Save to Training Dataset</Label>
              <p className="text-xs text-muted-foreground">
                Automatically save image and labels to improve model training
              </p>
            </div>
          </div>
          <Switch checked={saveToDataset} onCheckedChange={setSaveToDataset} />
        </div>

        {/* Advanced Settings Toggle */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Advanced Settings</span>
          </Button>
        </div>

        {/* Advanced Settings Panel */}
        {showAdvanced && (
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Confidence Threshold: {confidenceThreshold[0]}%
              </Label>
              <Slider
                value={confidenceThreshold}
                onValueChange={setConfidenceThreshold}
                max={100}
                min={10}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low (10%)</span>
                <span>Standard (50%)</span>
                <span>High (100%)</span>
              </div>
            </div>
          </div>
        )}

        {/* Upload Zone */}
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
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.dcm"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <CloudUpload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Drop {imageMode === 'xray' ? 'X-ray' : 'normal'} images here
          </h3>
          <p className="text-muted-foreground mb-4">
            Or click to select files from your computer
          </p>
          <p className="text-sm text-muted-foreground">
            Supports JPEG, PNG, and DICOM formats (max 10MB)
          </p>
          
          <Button className="mt-4">
            <Upload className="mr-2 h-4 w-4" />
            Select Files
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}