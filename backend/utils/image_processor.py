import numpy as np
from typing import List, Dict, Any

class ImageProcessor:
    def __init__(self):
        pass
    
    def process_detections(self, detections: List[Dict], image_width: int, image_height: int) -> Dict[str, Any]:
        """
        Process the raw detection results and return structured data.
        """
        processed_detections = []
        defect_types = {}
        total_confidence = 0
        
        for detection in detections:
            # Calculate center coordinates
            bbox = detection['bbox']
            center_x = bbox['x'] + bbox['width'] / 2
            center_y = bbox['y'] + bbox['height'] / 2
            
            # Process detection
            processed_detection = {
                'class': detection['class'],
                'confidence': detection['confidence'],
                'bbox': bbox,
                'center': {
                    'x': center_x,
                    'y': center_y
                }
            }
            
            processed_detections.append(processed_detection)
            
            # Count defect types
            defect_type = detection['class']
            defect_types[defect_type] = defect_types.get(defect_type, 0) + 1
            
            # Sum confidence scores
            total_confidence += detection['confidence']
        
        # Calculate average confidence
        average_confidence = total_confidence / len(detections) if detections else 0
        
        return {
            'detections': processed_detections,
            'total_defects': len(detections),
            'defect_types': defect_types,
            'average_confidence': average_confidence
        }
    
    def extract_image_features(self, image_array: np.ndarray) -> Dict[str, Any]:
        """
        Extract additional features from the image for analysis.
        """
        # Calculate basic statistics
        mean_intensity = np.mean(image_array)
        std_intensity = np.std(image_array)
        
        # Calculate histogram features
        hist, _ = np.histogram(image_array.flatten(), bins=256, range=(0, 256))
        
        return {
            'mean_intensity': float(mean_intensity),
            'std_intensity': float(std_intensity),
            'histogram': hist.tolist()
        }
    
    def calculate_defect_severity(self, detections: List[Dict]) -> str:
        """
        Calculate overall defect severity based on detected defects.
        """
        if not detections:
            return "No defects"
        
        total_defects = len(detections)
        avg_confidence = sum(d['confidence'] for d in detections) / total_defects
        
        # Critical defects (cracks are most serious)
        critical_defects = sum(1 for d in detections if d['class'] == 'crack')
        
        if critical_defects > 0:
            return "Critical"
        elif total_defects > 5 or avg_confidence > 0.9:
            return "High"
        elif total_defects > 2 or avg_confidence > 0.7:
            return "Medium"
        else:
            return "Low"
    
    def generate_recommendations(self, detections: List[Dict]) -> List[str]:
        """
        Generate recommendations based on detected defects.
        """
        recommendations = []
        
        if not detections:
            recommendations.append("No defects detected. Weld quality appears satisfactory.")
            return recommendations
        
        defect_types = set(d['class'] for d in detections)
        
        if 'crack' in defect_types:
            recommendations.append("Critical: Cracks detected. Immediate repair required.")
            recommendations.append("Review welding parameters and technique.")
        
        if 'porosity' in defect_types:
            recommendations.append("Porosity detected. Check gas shielding and cleanliness.")
            recommendations.append("Consider adjusting welding speed and heat input.")
        
        if 'slag' in defect_types:
            recommendations.append("Slag inclusions found. Improve inter-pass cleaning.")
            recommendations.append("Review welding technique and electrode condition.")
        
        return recommendations
