import { useState } from "react";
import { Settings, Sliders, Target, Zap, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface AdvancedSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdvancedSettings({ isOpen, onClose }: AdvancedSettingsProps) {
  const [sensitivity, setSensitivity] = useState([75]);
  const [enableCrackDetection, setEnableCrackDetection] = useState(true);
  const [enablePorosityDetection, setEnablePorosityDetection] = useState(true);
  const [enableSlagDetection, setEnableSlagDetection] = useState(true);
  const [analysisMode, setAnalysisMode] = useState("standard");
  const [confidenceThreshold, setConfidenceThreshold] = useState([50]);

  const handleSaveSettings = () => {
    // Save settings to localStorage for persistence
    const settings = {
      sensitivity: sensitivity[0],
      enableCrackDetection,
      enablePorosityDetection,
      enableSlagDetection,
      analysisMode,
      confidenceThreshold: confidenceThreshold[0]
    };
    localStorage.setItem('weldingAnalysisSettings', JSON.stringify(settings));
    onClose();
  };

  const handleResetDefaults = () => {
    setSensitivity([75]);
    setEnableCrackDetection(true);
    setEnablePorosityDetection(true);
    setEnableSlagDetection(true);
    setAnalysisMode("standard");
    setConfidenceThreshold([50]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Settings className="mr-2 w-5 h-5" />
            Advanced Analysis Settings
          </DialogTitle>
          <DialogDescription>
            Configure detection parameters and analysis preferences for optimal results.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Detection Sensitivity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <Target className="mr-2 w-4 h-4" />
                Detection Sensitivity
              </CardTitle>
              <CardDescription>
                Higher sensitivity detects more subtle defects but may increase false positives.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Sensitivity Level: {sensitivity[0]}%</Label>
                <Slider
                  value={sensitivity}
                  onValueChange={setSensitivity}
                  max={100}
                  min={25}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Conservative</span>
                  <span>Balanced</span>
                  <span>Aggressive</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <Zap className="mr-2 w-4 h-4" />
                Analysis Mode
              </CardTitle>
              <CardDescription>
                Choose the analysis approach based on your inspection requirements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={analysisMode} onValueChange={setAnalysisMode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select analysis mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fast">Fast Scan (30s) - Quick overview</SelectItem>
                  <SelectItem value="standard">Standard (60s) - Balanced accuracy</SelectItem>
                  <SelectItem value="thorough">Thorough (120s) - Maximum precision</SelectItem>
                  <SelectItem value="critical">Critical Inspection (180s) - Highest detail</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Defect Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <Sliders className="mr-2 w-4 h-4" />
                Defect Detection Types
              </CardTitle>
              <CardDescription>
                Enable or disable specific defect detection algorithms.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="crack-detection">Crack Detection</Label>
                  <p className="text-xs text-muted-foreground">Linear discontinuities and stress cracks</p>
                </div>
                <Switch
                  id="crack-detection"
                  checked={enableCrackDetection}
                  onCheckedChange={setEnableCrackDetection}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="porosity-detection">Porosity Detection</Label>
                  <p className="text-xs text-muted-foreground">Gas pockets and voids in weld metal</p>
                </div>
                <Switch
                  id="porosity-detection"
                  checked={enablePorosityDetection}
                  onCheckedChange={setEnablePorosityDetection}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="slag-detection">Slag Inclusion Detection</Label>
                  <p className="text-xs text-muted-foreground">Non-metallic inclusions and contamination</p>
                </div>
                <Switch
                  id="slag-detection"
                  checked={enableSlagDetection}
                  onCheckedChange={setEnableSlagDetection}
                />
              </div>
            </CardContent>
          </Card>

          {/* Confidence Threshold */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <Info className="mr-2 w-4 h-4" />
                Confidence Threshold
              </CardTitle>
              <CardDescription>
                Minimum confidence level required to report a defect.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Minimum Confidence: {confidenceThreshold[0]}%</Label>
                <Slider
                  value={confidenceThreshold}
                  onValueChange={setConfidenceThreshold}
                  max={95}
                  min={10}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Low threshold</span>
                  <span>Recommended</span>
                  <span>High threshold</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleResetDefaults}
              className="flex-1"
            >
              Reset to Defaults
            </Button>
            <Button
              onClick={handleSaveSettings}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary-dark"
            >
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}