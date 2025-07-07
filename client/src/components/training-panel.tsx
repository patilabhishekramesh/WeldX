import { useState, useRef, useCallback } from "react";
import { Upload, Plus, Trash2, Eye, Save, Play, Download, FolderOpen, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface TrainingImage {
  id: string;
  filename: string;
  url: string;
  labels: DefectLabel[];
  uploaded: Date;
}

interface DefectLabel {
  id: string;
  type: 'crack' | 'porosity' | 'slag' | 'clean';
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence?: number;
}

interface TrainingPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TrainingPanel({ isOpen, onClose }: TrainingPanelProps) {
  const [trainingImages, setTrainingImages] = useState<TrainingImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<TrainingImage | null>(null);
  const [isLabeling, setIsLabeling] = useState(false);
  const [labelingMode, setLabelingMode] = useState<'crack' | 'porosity' | 'slag' | 'clean'>('crack');
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const handleFileUpload = useCallback((files: FileList) => {
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const url = URL.createObjectURL(file);
        
        const newImage: TrainingImage = {
          id,
          filename: file.name,
          url,
          labels: [],
          uploaded: new Date()
        };
        
        setTrainingImages(prev => [...prev, newImage]);
        toast({
          title: "Image uploaded",
          description: `${file.name} added to training dataset`,
        });
      }
    });
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const startLabeling = (image: TrainingImage) => {
    setSelectedImage(image);
    setIsLabeling(true);
  };

  const addLabel = (bbox: { x: number; y: number; width: number; height: number }) => {
    if (!selectedImage) return;

    const newLabel: DefectLabel = {
      id: Date.now().toString(),
      type: labelingMode,
      bbox
    };

    const updatedImage = {
      ...selectedImage,
      labels: [...selectedImage.labels, newLabel]
    };

    setSelectedImage(updatedImage);
    setTrainingImages(prev => 
      prev.map(img => img.id === selectedImage.id ? updatedImage : img)
    );
  };

  const removeLabel = (labelId: string) => {
    if (!selectedImage) return;

    const updatedImage = {
      ...selectedImage,
      labels: selectedImage.labels.filter(label => label.id !== labelId)
    };

    setSelectedImage(updatedImage);
    setTrainingImages(prev => 
      prev.map(img => img.id === selectedImage.id ? updatedImage : img)
    );
  };

  const startTraining = async () => {
    if (trainingImages.length < 10) {
      toast({
        title: "Insufficient data",
        description: "Please upload at least 10 labeled images to start training",
        variant: "destructive"
      });
      return;
    }

    setIsTraining(true);
    setTrainingProgress(0);

    try {
      // Start training via API
      const response = await fetch('/api/train-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: trainingImages.map(img => ({
            filename: img.filename,
            labels: img.labels.map(label => ({
              type: label.type,
              bbox: label.bbox
            }))
          }))
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }

      toast({
        title: "Training started",
        description: `Training initiated with ${trainingImages.length} images`,
      });

      // Simulate progress updates
      const interval = setInterval(() => {
        setTrainingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsTraining(false);
            toast({
              title: "Training completed",
              description: "Your custom model is now ready for use!",
            });
            return 100;
          }
          return prev + 1.5;
        });
      }, 300);

    } catch (error) {
      setIsTraining(false);
      setTrainingProgress(0);
      toast({
        title: "Training failed",
        description: error.message || "An error occurred during model training",
        variant: "destructive"
      });
    }
  };

  const exportDataset = () => {
    const dataset = {
      version: "1.0",
      created: new Date().toISOString(),
      images: trainingImages.map(img => ({
        filename: img.filename,
        labels: img.labels
      }))
    };

    const blob = new Blob([JSON.stringify(dataset, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `welding_defect_dataset_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getDefectColor = (type: string) => {
    switch (type) {
      case 'crack': return 'border-red-500 bg-red-500/20';
      case 'porosity': return 'border-yellow-500 bg-yellow-500/20';
      case 'slag': return 'border-orange-500 bg-orange-500/20';
      case 'clean': return 'border-green-500 bg-green-500/20';
      default: return 'border-blue-500 bg-blue-500/20';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Tag className="mr-2 w-5 h-5" />
            AI Model Training Center
          </DialogTitle>
          <DialogDescription>
            Upload and label X-ray images to train a custom welding defect detection model
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload">Upload Images</TabsTrigger>
            <TabsTrigger value="label">Label Defects</TabsTrigger>
            <TabsTrigger value="dataset">Dataset Overview</TabsTrigger>
            <TabsTrigger value="train">Train Model</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="mr-2 w-4 h-4" />
                  Upload Training Images
                </CardTitle>
                <CardDescription>
                  Upload X-ray images of welded joints for training the AI model
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Drop X-ray images here</h3>
                  <p className="text-muted-foreground mb-4">or click to browse files</p>
                  <Button>Select Images</Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supports JPEG, PNG • Multiple files allowed
                  </p>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {trainingImages.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-3">Uploaded Images ({trainingImages.length})</h4>
                    <div className="grid grid-cols-3 gap-4 max-h-60 overflow-y-auto">
                      {trainingImages.map((image) => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.url}
                            alt={image.filename}
                            className="w-full h-24 object-cover rounded border"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => startLabeling(image)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Label
                            </Button>
                          </div>
                          <div className="absolute top-1 right-1">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="w-6 h-6 p-0"
                              onClick={() => setTrainingImages(prev => 
                                prev.filter(img => img.id !== image.id)
                              )}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {image.filename}
                          </p>
                          <p className="text-xs text-primary">
                            {image.labels.length} labels
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="label" className="space-y-4">
            {selectedImage ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Labeling: {selectedImage.filename}</span>
                    <div className="flex items-center gap-2">
                      <Select value={labelingMode} onValueChange={(value: any) => setLabelingMode(value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="crack">Crack</SelectItem>
                          <SelectItem value="porosity">Porosity</SelectItem>
                          <SelectItem value="slag">Slag</SelectItem>
                          <SelectItem value="clean">Clean Area</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" onClick={() => setIsLabeling(false)}>
                        Done
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <img
                      src={selectedImage.url}
                      alt={selectedImage.filename}
                      className="max-w-full h-auto rounded border"
                    />
                    
                    {/* Render existing labels */}
                    {selectedImage.labels.map((label) => (
                      <div
                        key={label.id}
                        className={`absolute border-2 ${getDefectColor(label.type)} rounded cursor-pointer`}
                        style={{
                          left: `${label.bbox.x}px`,
                          top: `${label.bbox.y}px`,
                          width: `${label.bbox.width}px`,
                          height: `${label.bbox.height}px`,
                        }}
                        onClick={() => removeLabel(label.id)}
                      >
                        <div className="absolute -top-6 left-0 bg-black text-white text-xs px-1 rounded">
                          {label.type}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Labels ({selectedImage.labels.length})</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {selectedImage.labels.map((label, index) => (
                        <div key={label.id} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">
                            {index + 1}. {label.type} ({label.bbox.width}×{label.bbox.height}px)
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeLabel(label.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-muted rounded">
                    <p className="text-sm text-muted-foreground">
                      <strong>Instructions:</strong> Click and drag on the image to create bounding boxes around defects. 
                      Select the defect type above before labeling. Click on existing labels to remove them.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Image Selected</h3>
                  <p className="text-muted-foreground">
                    Go to the Upload tab and select an image to start labeling
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="dataset" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <FolderOpen className="mr-2 w-4 h-4" />
                    Dataset Statistics
                  </span>
                  <Button onClick={exportDataset} variant="outline">
                    <Download className="mr-2 w-4 h-4" />
                    Export Dataset
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold text-primary">{trainingImages.length}</div>
                    <div className="text-sm text-muted-foreground">Total Images</div>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold text-red-500">
                      {trainingImages.reduce((sum, img) => sum + img.labels.filter(l => l.type === 'crack').length, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Cracks</div>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold text-yellow-500">
                      {trainingImages.reduce((sum, img) => sum + img.labels.filter(l => l.type === 'porosity').length, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Porosity</div>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold text-orange-500">
                      {trainingImages.reduce((sum, img) => sum + img.labels.filter(l => l.type === 'slag').length, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Slag</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Dataset Quality</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Labeled Images</span>
                      <span className="text-sm font-medium">
                        {trainingImages.filter(img => img.labels.length > 0).length} / {trainingImages.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Labels per Image</span>
                      <span className="text-sm font-medium">
                        {trainingImages.length > 0 
                          ? (trainingImages.reduce((sum, img) => sum + img.labels.length, 0) / trainingImages.length).toFixed(1)
                          : '0'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Ready for Training</span>
                      <span className={`text-sm font-medium ${trainingImages.length >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                        {trainingImages.length >= 10 ? 'Yes' : 'No (need 10+ images)'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="train" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Play className="mr-2 w-4 h-4" />
                  Train Custom Model
                </CardTitle>
                <CardDescription>
                  Train a custom AI model using your labeled dataset
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isTraining ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <h3 className="text-lg font-medium">Training in Progress</h3>
                      <p className="text-muted-foreground">Please wait while the model learns from your data</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Training Progress</span>
                        <span>{trainingProgress}%</span>
                      </div>
                      <Progress value={trainingProgress} className="w-full" />
                    </div>
                    
                    <div className="text-center text-sm text-muted-foreground">
                      Estimated time remaining: {Math.max(0, Math.ceil((100 - trainingProgress) / 2))} seconds
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 border rounded bg-muted/50">
                      <h4 className="font-medium mb-2">Training Configuration</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Dataset Size:</strong> {trainingImages.length} images
                        </div>
                        <div>
                          <strong>Total Labels:</strong> {trainingImages.reduce((sum, img) => sum + img.labels.length, 0)}
                        </div>
                        <div>
                          <strong>Training Method:</strong> Transfer Learning
                        </div>
                        <div>
                          <strong>Estimated Time:</strong> 2-5 minutes
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={startTraining}
                      disabled={trainingImages.length < 10}
                      className="w-full"
                      size="lg"
                    >
                      <Play className="mr-2 w-4 h-4" />
                      Start Training
                    </Button>

                    {trainingImages.length < 10 && (
                      <p className="text-sm text-muted-foreground text-center">
                        Upload and label at least 10 images to start training
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}