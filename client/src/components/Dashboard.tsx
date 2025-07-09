import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  Upload, 
  Play, 
  Settings, 
  BarChart3, 
  Brain, 
  FileImage, 
  Zap, 
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Eye,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface DetectionResult {
  class: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  center: {
    x: number;
    y: number;
  };
  severity?: string;
  recommendations?: string[];
}

interface AnalysisResult {
  success: boolean;
  message: string;
  image_info: {
    filename: string;
    width: number;
    height: number;
    format: string;
    size_bytes: number;
  };
  detections: DetectionResult[];
  summary: {
    total_defects: number;
    defect_types: Record<string, number>;
    average_confidence: number;
    processing_time: number;
  };
}

interface ModelInfo {
  training_id: string;
  algorithm: string;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
  };
  training_time: number;
  created_at: string;
}

export default function Dashboard() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
  
  // Advanced settings
  const [enhancementMode, setEnhancementMode] = useState('advanced');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);
  const [useEnhanced, setUseEnhanced] = useState(true);
  const [includeRecommendations, setIncludeRecommendations] = useState(true);
  
  // Training state
  const [trainingData, setTrainingData] = useState<File[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);

  useEffect(() => {
    loadModels();
    loadAnalysisHistory();
  }, []);

  const loadModels = async () => {
    try {
      const response = await fetch('/api/models');
      if (response.ok) {
        const data = await response.json();
        setModels(data.models || []);
      }
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  const loadAnalysisHistory = async () => {
    try {
      const response = await fetch('/api/analysis-history');
      if (response.ok) {
        const data = await response.json();
        setAnalysisHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error loading analysis history:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setAnalysisResult(null);
    }
  };

  const analyzeImage = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('enhancement_mode', enhancementMode);
    formData.append('confidence_threshold', confidenceThreshold.toString());
    formData.append('use_enhanced', useEnhanced.toString());
    formData.append('include_recommendations', includeRecommendations.toString());

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setAnalysisResult(result);
        loadAnalysisHistory();
      } else {
        const error = await response.json();
        setAnalysisResult({
          success: false,
          message: error.message || 'Analysis failed',
          image_info: { filename: '', width: 0, height: 0, format: '', size_bytes: 0 },
          detections: [],
          summary: { total_defects: 0, defect_types: {}, average_confidence: 0, processing_time: 0 }
        });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisResult({
        success: false,
        message: 'Network error occurred',
        image_info: { filename: '', width: 0, height: 0, format: '', size_bytes: 0 },
        detections: [],
        summary: { total_defects: 0, defect_types: {}, average_confidence: 0, processing_time: 0 }
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startTraining = async () => {
    if (trainingData.length === 0) return;

    setIsTraining(true);
    setTrainingProgress(0);

    // Simulate training progress
    const progressInterval = setInterval(() => {
      setTrainingProgress(prev => Math.min(prev + 10, 90));
    }, 500);

    try {
      const formData = new FormData();
      trainingData.forEach((file, index) => {
        formData.append(`training_images`, file);
      });

      const response = await fetch('/api/train', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setTrainingProgress(100);

      if (response.ok) {
        const result = await response.json();
        loadModels();
        setTrainingData([]);
      }
    } catch (error) {
      console.error('Training error:', error);
      clearInterval(progressInterval);
    } finally {
      setIsTraining(false);
      setTimeout(() => setTrainingProgress(0), 1000);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getDefectIcon = (defectType: string) => {
    switch (defectType) {
      case 'crack': return <AlertTriangle className="w-4 h-4" />;
      case 'porosity': return <Target className="w-4 h-4" />;
      case 'slag_inclusion': return <XCircle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI Welding Defect Detection Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Advanced AI-powered analysis for welding defect detection with machine learning capabilities
          </p>
        </div>

        <Tabs defaultValue="analysis" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <FileImage className="w-4 h-4" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="training" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Training
            </TabsTrigger>
            <TabsTrigger value="models" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Models
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Image Upload
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="mb-4"
                    />
                    {selectedFile && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    onClick={analyzeImage}
                    disabled={!selectedFile || isAnalyzing}
                    className="w-full"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Analyze Image
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Analysis Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Analysis Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysisResult ? (
                    <div className="space-y-4">
                      {analysisResult.success ? (
                        <>
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium">Analysis Completed</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <p className="text-sm font-medium">Total Defects</p>
                              <p className="text-2xl font-bold text-blue-600">
                                {analysisResult.summary.total_defects}
                              </p>
                            </div>
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <p className="text-sm font-medium">Avg Confidence</p>
                              <p className="text-2xl font-bold text-green-600">
                                {(analysisResult.summary.average_confidence * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-medium">Defect Types</h4>
                            {Object.entries(analysisResult.summary.defect_types).map(([type, count]) => (
                              <div key={type} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {getDefectIcon(type)}
                                  <span className="capitalize">{type.replace('_', ' ')}</span>
                                </div>
                                <Badge variant="secondary">{count}</Badge>
                              </div>
                            ))}
                          </div>

                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Processing time: {analysisResult.summary.processing_time.toFixed(2)}s
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-red-600">
                          <XCircle className="w-5 h-5" />
                          <span>{analysisResult.message}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Upload an image to see analysis results
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Detections Details */}
            {analysisResult?.success && analysisResult.detections.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Detections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisResult.detections.map((detection, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getDefectIcon(detection.class)}
                            <span className="font-medium capitalize">
                              {detection.class.replace('_', ' ')}
                            </span>
                            {detection.severity && (
                              <Badge className={`${getSeverityColor(detection.severity)} text-white`}>
                                {detection.severity}
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm font-medium">
                            {(detection.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Position</p>
                            <p>X: {detection.bbox.x}, Y: {detection.bbox.y}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Size</p>
                            <p>{detection.bbox.width} × {detection.bbox.height}</p>
                          </div>
                        </div>

                        {detection.recommendations && (
                          <div className="mt-3">
                            <p className="text-sm font-medium mb-1">Recommendations:</p>
                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                              {detection.recommendations.map((rec, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-1">•</span>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Model Training
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Training Images</Label>
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setTrainingData(Array.from(e.target.files || []))}
                  />
                  {trainingData.length > 0 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {trainingData.length} image(s) selected
                    </p>
                  )}
                </div>

                {isTraining && (
                  <div className="space-y-2">
                    <Label>Training Progress</Label>
                    <Progress value={trainingProgress} className="w-full" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {trainingProgress}% complete
                    </p>
                  </div>
                )}

                <Button 
                  onClick={startTraining}
                  disabled={trainingData.length === 0 || isTraining}
                  className="w-full"
                >
                  {isTraining ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Training...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Training
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Models Tab */}
          <TabsContent value="models" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Available Models
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {models.length > 0 ? (
                    models.map((model, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">Model {model.training_id}</h3>
                          <Badge variant="outline">{model.algorithm || 'Unknown'}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Accuracy</p>
                            <p className="font-medium">{model.metrics ? (model.metrics.accuracy * 100).toFixed(1) : 'N/A'}%</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">F1 Score</p>
                            <p className="font-medium">{model.metrics ? (model.metrics.f1_score * 100).toFixed(1) : 'N/A'}%</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Training Time</p>
                            <p className="font-medium">{model.training_time ? model.training_time.toFixed(2) : 'N/A'}s</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Created</p>
                            <p className="font-medium">{new Date(model.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No trained models available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Analysis History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisHistory.length > 0 ? (
                    analysisHistory.map((analysis, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{analysis.image_info.filename}</h3>
                          <Badge variant={analysis.success ? "default" : "destructive"}>
                            {analysis.success ? "Success" : "Failed"}
                          </Badge>
                        </div>
                        
                        {analysis.success && (
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Defects</p>
                              <p className="font-medium">{analysis.summary.total_defects}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Confidence</p>
                              <p className="font-medium">{(analysis.summary.average_confidence * 100).toFixed(1)}%</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Processing</p>
                              <p className="font-medium">{analysis.summary.processing_time.toFixed(2)}s</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No analysis history available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Analysis Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Enhancement Mode</Label>
                  <Select value={enhancementMode} onValueChange={setEnhancementMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="high_sensitivity">High Sensitivity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Confidence Threshold: {confidenceThreshold.toFixed(2)}</Label>
                  <Input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Use Enhanced Detector</Label>
                  <Switch checked={useEnhanced} onCheckedChange={setUseEnhanced} />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Include Recommendations</Label>
                  <Switch checked={includeRecommendations} onCheckedChange={setIncludeRecommendations} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}