import { Expand, Download, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalysisResponse } from "@shared/schema";

interface ImageAnalysisProps {
  imagePreview: string;
  analysisResult: AnalysisResponse | null;
  isProcessing: boolean;
}

export default function ImageAnalysis({ 
  imagePreview, 
  analysisResult, 
  isProcessing 
}: ImageAnalysisProps) {
  const getDefectColor = (defectType: string) => {
    switch (defectType.toLowerCase()) {
      case 'crack':
        return 'border-red-500 bg-red-500/20';
      case 'porosity':
        return 'border-yellow-500 bg-yellow-500/20';
      case 'slag':
      case 'slag inclusion':
        return 'border-orange-500 bg-orange-500/20';
      default:
        return 'border-blue-500 bg-blue-500/20';
    }
  };

  const getDefectLabelColor = (defectType: string) => {
    switch (defectType.toLowerCase()) {
      case 'crack':
        return 'bg-red-500 text-white';
      case 'porosity':
        return 'bg-yellow-500 text-white';
      case 'slag':
      case 'slag inclusion':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  return (
    <Card className="elevation-2 overflow-hidden">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <ImageIcon className="text-primary mr-2 w-5 h-5" />
            Image Analysis
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Expand className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
          <img
            src={imagePreview}
            alt="X-ray radiographic image"
            className="w-full h-full object-contain"
          />
          
          {/* Defect Detection Overlays */}
          {analysisResult && analysisResult.detections.map((detection, index) => (
            <div
              key={index}
              className={`absolute border-2 ${getDefectColor(detection.class)} rounded`}
              style={{
                left: `${(detection.bbox.x / analysisResult.image_info.width) * 100}%`,
                top: `${(detection.bbox.y / analysisResult.image_info.height) * 100}%`,
                width: `${(detection.bbox.width / analysisResult.image_info.width) * 100}%`,
                height: `${(detection.bbox.height / analysisResult.image_info.height) * 100}%`,
              }}
            >
              <div className={`absolute -top-8 left-0 ${getDefectLabelColor(detection.class)} text-xs px-2 py-1 rounded whitespace-nowrap`}>
                {detection.class} • {Math.round(detection.confidence * 100)}%
              </div>
            </div>
          ))}
        </div>
        
        {/* Processing Status */}
        {isProcessing && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
              <span className="text-blue-800 font-medium">Processing...</span>
              <span className="text-blue-600 text-sm ml-2">• Analyzing image</span>
            </div>
          </div>
        )}
        
        {analysisResult && !isProcessing && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-600 rounded-full mr-2 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <span className="text-green-800 font-medium">Analysis Complete</span>
              <span className="text-green-600 text-sm ml-2">
                • Processed in {analysisResult.summary.processing_time.toFixed(1)}s
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
