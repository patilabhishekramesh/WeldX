import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DefectLabel {
  id: string;
  type: 'crack' | 'porosity' | 'slag' | 'clean';
  bbox: BoundingBox;
}

interface ImageLabelerProps {
  imageUrl: string;
  labels: DefectLabel[];
  onLabelsChange: (labels: DefectLabel[]) => void;
  className?: string;
}

export default function ImageLabeler({ imageUrl, labels, onLabelsChange, className }: ImageLabelerProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<BoundingBox | null>(null);
  const [labelType, setLabelType] = useState<'crack' | 'porosity' | 'slag' | 'clean'>('crack');
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      setImageSize({
        width: imageRef.current.offsetWidth,
        height: imageRef.current.offsetHeight
      });
    }
  }, []);

  const getRelativeCoordinates = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const coords = getRelativeCoordinates(e);
    setIsDrawing(true);
    setStartPoint(coords);
    setCurrentBox(null);
  }, [getRelativeCoordinates]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !startPoint) return;

    const coords = getRelativeCoordinates(e);
    const box: BoundingBox = {
      x: Math.min(startPoint.x, coords.x),
      y: Math.min(startPoint.y, coords.y),
      width: Math.abs(coords.x - startPoint.x),
      height: Math.abs(coords.y - startPoint.y)
    };

    setCurrentBox(box);
  }, [isDrawing, startPoint, getRelativeCoordinates]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !currentBox || currentBox.width < 10 || currentBox.height < 10) {
      setIsDrawing(false);
      setStartPoint(null);
      setCurrentBox(null);
      return;
    }

    const newLabel: DefectLabel = {
      id: Date.now().toString(),
      type: labelType,
      bbox: currentBox
    };

    onLabelsChange([...labels, newLabel]);
    
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentBox(null);
  }, [isDrawing, currentBox, labelType, labels, onLabelsChange]);

  const removeLabel = useCallback((labelId: string) => {
    onLabelsChange(labels.filter(label => label.id !== labelId));
  }, [labels, onLabelsChange]);

  const getDefectColor = (type: string) => {
    switch (type) {
      case 'crack': return 'border-red-500 bg-red-500/20';
      case 'porosity': return 'border-yellow-500 bg-yellow-500/20';
      case 'slag': return 'border-orange-500 bg-orange-500/20';
      case 'clean': return 'border-green-500 bg-green-500/20';
      default: return 'border-blue-500 bg-blue-500/20';
    }
  };

  const getDefectBorderColor = (type: string) => {
    switch (type) {
      case 'crack': return '#ef4444';
      case 'porosity': return '#eab308';
      case 'slag': return '#f97316';
      case 'clean': return '#22c55e';
      default: return '#3b82f6';
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDrawing) {
        handleMouseUp();
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDrawing, handleMouseUp]);

  return (
    <div className={className}>
      <div className="mb-4 flex items-center gap-4">
        <Select value={labelType} onValueChange={(value: any) => setLabelType(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="crack">🔴 Crack</SelectItem>
            <SelectItem value="porosity">🟡 Porosity</SelectItem>
            <SelectItem value="slag">🟠 Slag Inclusion</SelectItem>
            <SelectItem value="clean">🟢 Clean Area</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground">
          Click and drag to create bounding boxes
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative inline-block cursor-crosshair border rounded overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ userSelect: 'none' }}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Labeling image"
          className="max-w-full h-auto"
          onLoad={handleImageLoad}
          draggable={false}
        />

        {/* Existing labels */}
        {labels.map((label) => (
          <div
            key={label.id}
            className={`absolute border-2 ${getDefectColor(label.type)} rounded cursor-pointer hover:opacity-80 transition-opacity`}
            style={{
              left: `${label.bbox.x}px`,
              top: `${label.bbox.y}px`,
              width: `${label.bbox.width}px`,
              height: `${label.bbox.height}px`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              removeLabel(label.id);
            }}
          >
            <div 
              className="absolute -top-6 left-0 text-white text-xs px-1 py-0.5 rounded text-nowrap font-medium"
              style={{ backgroundColor: getDefectBorderColor(label.type) }}
            >
              {label.type}
            </div>
          </div>
        ))}

        {/* Current drawing box */}
        {currentBox && (
          <div
            className={`absolute border-2 ${getDefectColor(labelType)} rounded pointer-events-none`}
            style={{
              left: `${currentBox.x}px`,
              top: `${currentBox.y}px`,
              width: `${currentBox.width}px`,
              height: `${currentBox.height}px`,
            }}
          >
            <div 
              className="absolute -top-6 left-0 text-white text-xs px-1 py-0.5 rounded font-medium"
              style={{ backgroundColor: getDefectBorderColor(labelType) }}
            >
              {labelType}
            </div>
          </div>
        )}
      </div>

      {labels.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Labels ({labels.length})</h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {labels.map((label, index) => (
              <div key={label.id} className="flex items-center justify-between p-2 border rounded text-sm">
                <span>
                  {index + 1}. <span className="font-medium">{label.type}</span> 
                  <span className="text-muted-foreground ml-2">
                    ({label.bbox.width}×{label.bbox.height}px)
                  </span>
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeLabel(label.id)}
                  className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}