import { ChartLine, List, Download, Share, RotateCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalysisResponse } from "@shared/schema";

interface ResultsPanelProps {
  analysisResult: AnalysisResponse | null;
  onNewAnalysis: () => void;
}

export default function ResultsPanel({ analysisResult, onNewAnalysis }: ResultsPanelProps) {
  const getDefectIcon = (defectType: string) => {
    switch (defectType.toLowerCase()) {
      case 'crack':
        return '!';
      case 'porosity':
        return '○';
      case 'slag':
      case 'slag inclusion':
        return '■';
      default:
        return '●';
    }
  };

  const getDefectColor = (defectType: string) => {
    switch (defectType.toLowerCase()) {
      case 'crack':
        return 'bg-red-500';
      case 'porosity':
        return 'bg-yellow-500';
      case 'slag':
      case 'slag inclusion':
        return 'bg-orange-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getDefectDescription = (defectType: string) => {
    switch (defectType.toLowerCase()) {
      case 'crack':
        return 'Linear discontinuity detected';
      case 'porosity':
        return 'Gas pocket formation';
      case 'slag':
      case 'slag inclusion':
        return 'Non-metallic inclusion';
      default:
        return 'Weld defect detected';
    }
  };

  return (
    <>
      {/* Analysis Summary */}
      <Card className="elevation-2 overflow-hidden">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center">
            <ChartLine className="text-primary mr-2 w-5 h-5" />
            Analysis Summary
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6 space-y-4">
          {analysisResult ? (
            <>
              {/* Overall Status */}
              <div className={`flex items-center justify-between p-4 rounded-lg border ${
                analysisResult.summary.total_defects > 0 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center">
                  {analysisResult.summary.total_defects > 0 ? (
                    <AlertTriangle className="text-red-600 mr-2 w-5 h-5" />
                  ) : (
                    <div className="w-5 h-5 bg-green-600 rounded-full mr-2 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                  <span className={`font-medium ${
                    analysisResult.summary.total_defects > 0 ? 'text-red-800' : 'text-green-800'
                  }`}>
                    {analysisResult.summary.total_defects > 0 ? 'Defects Detected' : 'No Defects Found'}
                  </span>
                </div>
                <span className={`font-bold text-lg ${
                  analysisResult.summary.total_defects > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {analysisResult.summary.total_defects}
                </span>
              </div>
              
              {/* Defect Breakdown */}
              {analysisResult.summary.total_defects > 0 && (
                <div className="space-y-3">
                  {Object.entries(analysisResult.summary.defect_types).map(([defectType, count]) => (
                    <div key={defectType} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 ${getDefectColor(defectType)} rounded-full mr-3`}></div>
                        <span className="text-sm font-medium capitalize">{defectType}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{count} detected</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Confidence Score */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">Average Confidence</span>
                  <span className="text-sm font-bold text-blue-900">
                    {Math.round(analysisResult.summary.average_confidence * 100)}%
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${analysisResult.summary.average_confidence * 100}%` }}
                  ></div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <ChartLine className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Upload an image to see analysis results</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <Card className="elevation-2 overflow-hidden">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center">
            <List className="text-primary mr-2 w-5 h-5" />
            Detailed Results
          </CardTitle>
        </CardHeader>
        
        <div className="divide-y divide-border">
          {analysisResult && analysisResult.detections.length > 0 ? (
            analysisResult.detections.map((detection, index) => (
              <div key={index} className="p-4">
                <div className="flex items-start space-x-3">
                  <div className={`w-6 h-6 ${getDefectColor(detection.class)} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-xs font-bold">
                      {getDefectIcon(detection.class)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground capitalize">{detection.class}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getDefectDescription(detection.class)}
                    </p>
                    <div className="mt-2 text-xs text-muted-foreground space-y-1">
                      <div>
                        Confidence: <span className="font-medium">{Math.round(detection.confidence * 100)}%</span>
                      </div>
                      <div>
                        Location: <span className="font-mono">x:{Math.round(detection.center.x)}, y:{Math.round(detection.center.y)}</span>
                      </div>
                      <div>
                        Size: <span className="font-mono">{Math.round(detection.bbox.width)}×{Math.round(detection.bbox.height)} px</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center">
              <List className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No detailed results available</p>
            </div>
          )}
        </div>
      </Card>

      {/* Action Buttons */}
      <Card className="elevation-2 p-6">
        <div className="space-y-3">
          <Button 
            className="w-full bg-primary text-primary-foreground hover:bg-primary-dark"
            disabled={!analysisResult}
          >
            <Download className="mr-2 w-4 h-4" />
            Export Report
          </Button>
          
          <Button 
            variant="secondary" 
            className="w-full"
            disabled={!analysisResult}
          >
            <Share className="mr-2 w-4 h-4" />
            Share Results
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full border-green-200 text-green-700 hover:bg-green-50"
            onClick={onNewAnalysis}
          >
            <RotateCcw className="mr-2 w-4 h-4" />
            Analyze New Image
          </Button>
        </div>
      </Card>
    </>
  );
}
