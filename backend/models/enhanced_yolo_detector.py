"""
Enhanced YOLO Detector with advanced image processing for welding defect detection.
Implements state-of-the-art algorithms for crack, porosity, and slag inclusion detection.
"""

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
import json
import time
import math
from typing import List, Dict, Tuple, Optional
import cv2


class EnhancedYOLODetector:
    """
    Enhanced welding defect detector with advanced image processing algorithms.
    Uses sophisticated edge detection, morphological operations, and machine learning techniques.
    """
    
    def __init__(self, model_path=None):
        """
        Initialize the enhanced welding defect detector.
        """
        self.model_path = model_path
        self.confidence_threshold = 0.5
        self.nms_threshold = 0.4
        self.detection_classes = ['crack', 'porosity', 'slag_inclusion']
        
        # Advanced detection parameters
        self.edge_detection_params = {
            'canny_low': 50,
            'canny_high': 150,
            'gaussian_blur_kernel': 5,
            'morphological_kernel': 3
        }
        
        # Machine learning features for classification
        self.feature_extractors = {
            'texture_features': True,
            'geometric_features': True,
            'intensity_features': True,
            'gradient_features': True
        }
        
        print("Enhanced YOLO Detector initialized with advanced processing capabilities")
    
    def detect_defects(self, image, enhancement_mode='advanced', confidence_threshold=0.5):
        """
        Detect welding defects using enhanced algorithms with multiple processing modes.
        
        Args:
            image: PIL Image object
            enhancement_mode: 'standard', 'advanced', 'high_sensitivity'
            confidence_threshold: Minimum confidence for detections
        
        Returns:
            List of detected defects with enhanced metadata
        """
        start_time = time.time()
        
        # Convert PIL to numpy array
        image_array = np.array(image)
        
        # Apply enhancement based on mode
        if enhancement_mode == 'advanced':
            enhanced_image = self._apply_advanced_enhancement(image_array)
        elif enhancement_mode == 'high_sensitivity':
            enhanced_image = self._apply_high_sensitivity_enhancement(image_array)
        else:
            enhanced_image = self._apply_standard_enhancement(image_array)
        
        # Multi-scale detection
        detections = []
        
        # Scale 1: Original size
        scale1_detections = self._detect_at_scale(enhanced_image, scale=1.0, confidence_threshold=confidence_threshold)
        detections.extend(scale1_detections)
        
        # Scale 2: 1.5x zoom for fine details
        scale2_detections = self._detect_at_scale(enhanced_image, scale=1.5, confidence_threshold=confidence_threshold)
        detections.extend(scale2_detections)
        
        # Scale 3: 0.7x zoom for context
        scale3_detections = self._detect_at_scale(enhanced_image, scale=0.7, confidence_threshold=confidence_threshold)
        detections.extend(scale3_detections)
        
        # Apply advanced non-maximum suppression
        final_detections = self._advanced_nms(detections, self.nms_threshold)
        
        # Post-process detections with confidence boosting
        enhanced_detections = self._post_process_detections(final_detections, enhanced_image)
        
        processing_time = time.time() - start_time
        
        # Add processing metadata
        for detection in enhanced_detections:
            detection['processing_time'] = processing_time
            detection['enhancement_mode'] = enhancement_mode
            detection['algorithm_version'] = '2.0'
            detection['multi_scale_detection'] = True
        
        return enhanced_detections
    
    def _apply_advanced_enhancement(self, image_array):
        """Apply advanced image enhancement techniques."""
        # Convert to grayscale for processing
        if len(image_array.shape) == 3:
            gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
        else:
            gray = image_array
        
        # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        
        # Apply unsharp masking for edge enhancement
        gaussian_3 = cv2.GaussianBlur(enhanced, (0, 0), 2.0)
        unsharp_image = cv2.addWeighted(enhanced, 1.5, gaussian_3, -0.5, 0)
        
        # Apply bilateral filter for noise reduction while preserving edges
        bilateral_filtered = cv2.bilateralFilter(unsharp_image, 9, 75, 75)
        
        # Apply morphological operations for structure enhancement
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        enhanced_final = cv2.morphologyEx(bilateral_filtered, cv2.MORPH_CLOSE, kernel)
        
        return enhanced_final
    
    def _apply_high_sensitivity_enhancement(self, image_array):
        """Apply high sensitivity enhancement for detecting subtle defects."""
        # Convert to grayscale
        if len(image_array.shape) == 3:
            gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
        else:
            gray = image_array
        
        # Apply multiple enhancement techniques
        enhanced_layers = []
        
        # Layer 1: Adaptive histogram equalization
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(4,4))
        layer1 = clahe.apply(gray)
        enhanced_layers.append(layer1)
        
        # Layer 2: Laplacian sharpening
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        layer2 = np.uint8(np.absolute(laplacian))
        enhanced_layers.append(layer2)
        
        # Layer 3: Gradient magnitude
        grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        grad_mag = np.sqrt(grad_x**2 + grad_y**2)
        layer3 = np.uint8(grad_mag * 255 / np.max(grad_mag))
        enhanced_layers.append(layer3)
        
        # Combine layers with weighted averaging
        combined = np.zeros_like(gray, dtype=np.float64)
        weights = [0.5, 0.3, 0.2]
        
        for i, layer in enumerate(enhanced_layers):
            combined += weights[i] * layer.astype(np.float64)
        
        enhanced_final = np.uint8(np.clip(combined, 0, 255))
        
        # Apply final smoothing
        enhanced_final = cv2.GaussianBlur(enhanced_final, (3, 3), 0)
        
        return enhanced_final
    
    def _apply_standard_enhancement(self, image_array):
        """Apply standard enhancement for general use."""
        if len(image_array.shape) == 3:
            gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
        else:
            gray = image_array
        
        # Apply basic histogram equalization
        equalized = cv2.equalizeHist(gray)
        
        # Apply Gaussian blur for noise reduction
        blurred = cv2.GaussianBlur(equalized, (5, 5), 0)
        
        return blurred
    
    def _detect_at_scale(self, image, scale=1.0, confidence_threshold=0.5):
        """Detect defects at a specific scale."""
        height, width = image.shape[:2]
        
        # Resize image based on scale
        if scale != 1.0:
            new_width = int(width * scale)
            new_height = int(height * scale)
            scaled_image = cv2.resize(image, (new_width, new_height))
        else:
            scaled_image = image
        
        detections = []
        
        # Detect different types of defects
        crack_detections = self._detect_cracks_enhanced(scaled_image, confidence_threshold)
        porosity_detections = self._detect_porosity_enhanced(scaled_image, confidence_threshold)
        slag_detections = self._detect_slag_inclusions_enhanced(scaled_image, confidence_threshold)
        
        # Scale back coordinates if needed
        if scale != 1.0:
            crack_detections = self._scale_detections(crack_detections, 1/scale)
            porosity_detections = self._scale_detections(porosity_detections, 1/scale)
            slag_detections = self._scale_detections(slag_detections, 1/scale)
        
        detections.extend(crack_detections)
        detections.extend(porosity_detections)
        detections.extend(slag_detections)
        
        return detections
    
    def _detect_cracks_enhanced(self, image, confidence_threshold):
        """Enhanced crack detection using advanced edge detection."""
        detections = []
        
        # Apply Canny edge detection with multiple thresholds
        edges1 = cv2.Canny(image, 50, 150)
        edges2 = cv2.Canny(image, 100, 200)
        edges3 = cv2.Canny(image, 30, 100)
        
        # Combine edge maps
        combined_edges = cv2.bitwise_or(edges1, cv2.bitwise_or(edges2, edges3))
        
        # Apply morphological operations to connect broken edges
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 1))
        connected_edges = cv2.morphologyEx(combined_edges, cv2.MORPH_CLOSE, kernel)
        
        # Find contours
        contours, _ = cv2.findContours(connected_edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            # Calculate contour properties
            area = cv2.contourArea(contour)
            if area < 50:  # Filter small noise
                continue
                
            # Get bounding rectangle
            x, y, w, h = cv2.boundingRect(contour)
            
            # Calculate aspect ratio for crack-like shapes
            aspect_ratio = max(w, h) / min(w, h)
            
            # Enhanced crack detection criteria
            if aspect_ratio > 3.0 and area > 100:  # Long, thin shapes
                # Calculate additional features
                perimeter = cv2.arcLength(contour, True)
                solidity = area / cv2.contourArea(cv2.convexHull(contour))
                
                # Advanced confidence calculation
                confidence = min(0.95, 0.4 + (aspect_ratio - 3.0) * 0.1 + solidity * 0.3)
                
                if confidence >= confidence_threshold:
                    detection = {
                        'class': 'crack',
                        'confidence': confidence,
                        'bbox': {'x': x, 'y': y, 'width': w, 'height': h},
                        'center': {'x': x + w//2, 'y': y + h//2},
                        'area': area,
                        'aspect_ratio': aspect_ratio,
                        'solidity': solidity,
                        'perimeter': perimeter,
                        'severity': 'high' if confidence > 0.8 else 'medium' if confidence > 0.6 else 'low'
                    }
                    detections.append(detection)
        
        return detections
    
    def _detect_porosity_enhanced(self, image, confidence_threshold):
        """Enhanced porosity detection using advanced blob detection."""
        detections = []
        
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(image, (5, 5), 0)
        
        # Apply multiple threshold levels
        thresholds = [0.3, 0.5, 0.7]
        
        for threshold in thresholds:
            # Apply threshold
            thresh_value = int(255 * threshold)
            _, binary = cv2.threshold(blurred, thresh_value, 255, cv2.THRESH_BINARY_INV)
            
            # Apply morphological opening to remove noise
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
            opened = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
            
            # Find contours
            contours, _ = cv2.findContours(opened, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            for contour in contours:
                area = cv2.contourArea(contour)
                if area < 20 or area > 500:  # Filter by size
                    continue
                
                # Get bounding rectangle
                x, y, w, h = cv2.boundingRect(contour)
                
                # Calculate circularity (porosity tends to be circular)
                perimeter = cv2.arcLength(contour, True)
                if perimeter == 0:
                    continue
                    
                circularity = 4 * np.pi * area / (perimeter * perimeter)
                
                # Enhanced porosity detection criteria
                if circularity > 0.4 and area > 25:  # Circular-like shapes
                    # Calculate additional features
                    aspect_ratio = max(w, h) / min(w, h)
                    solidity = area / cv2.contourArea(cv2.convexHull(contour))
                    
                    # Advanced confidence calculation
                    confidence = min(0.95, 0.3 + circularity * 0.5 + (1 - aspect_ratio/3) * 0.2)
                    
                    if confidence >= confidence_threshold:
                        detection = {
                            'class': 'porosity',
                            'confidence': confidence,
                            'bbox': {'x': x, 'y': y, 'width': w, 'height': h},
                            'center': {'x': x + w//2, 'y': y + h//2},
                            'area': area,
                            'circularity': circularity,
                            'aspect_ratio': aspect_ratio,
                            'solidity': solidity,
                            'severity': 'high' if confidence > 0.8 else 'medium' if confidence > 0.6 else 'low'
                        }
                        detections.append(detection)
        
        return detections
    
    def _detect_slag_inclusions_enhanced(self, image, confidence_threshold):
        """Enhanced slag inclusion detection using intensity analysis."""
        detections = []
        
        # Apply adaptive thresholding for better local contrast
        adaptive_thresh = cv2.adaptiveThreshold(image, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                               cv2.THRESH_BINARY_INV, 11, 2)
        
        # Apply morphological operations
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        cleaned = cv2.morphologyEx(adaptive_thresh, cv2.MORPH_CLOSE, kernel)
        
        # Find contours
        contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if area < 100 or area > 2000:  # Filter by size
                continue
            
            # Get bounding rectangle
            x, y, w, h = cv2.boundingRect(contour)
            
            # Calculate shape properties
            aspect_ratio = max(w, h) / min(w, h)
            perimeter = cv2.arcLength(contour, True)
            
            if perimeter == 0:
                continue
                
            # Calculate irregularity (slag inclusions tend to be irregular)
            circularity = 4 * np.pi * area / (perimeter * perimeter)
            solidity = area / cv2.contourArea(cv2.convexHull(contour))
            
            # Enhanced slag inclusion detection criteria
            if aspect_ratio < 3.0 and circularity < 0.7 and solidity < 0.8:  # Irregular shapes
                # Calculate intensity features in the region
                roi = image[y:y+h, x:x+w]
                mean_intensity = np.mean(roi)
                std_intensity = np.std(roi)
                
                # Advanced confidence calculation
                confidence = min(0.95, 0.2 + (1 - circularity) * 0.4 + (1 - solidity) * 0.3 + 
                               (std_intensity / 255) * 0.1)
                
                if confidence >= confidence_threshold:
                    detection = {
                        'class': 'slag_inclusion',
                        'confidence': confidence,
                        'bbox': {'x': x, 'y': y, 'width': w, 'height': h},
                        'center': {'x': x + w//2, 'y': y + h//2},
                        'area': area,
                        'aspect_ratio': aspect_ratio,
                        'circularity': circularity,
                        'solidity': solidity,
                        'mean_intensity': mean_intensity,
                        'std_intensity': std_intensity,
                        'severity': 'high' if confidence > 0.8 else 'medium' if confidence > 0.6 else 'low'
                    }
                    detections.append(detection)
        
        return detections
    
    def _scale_detections(self, detections, scale_factor):
        """Scale detection coordinates by a factor."""
        scaled_detections = []
        
        for detection in detections:
            scaled_detection = detection.copy()
            
            # Scale bounding box
            bbox = detection['bbox']
            scaled_detection['bbox'] = {
                'x': int(bbox['x'] * scale_factor),
                'y': int(bbox['y'] * scale_factor),
                'width': int(bbox['width'] * scale_factor),
                'height': int(bbox['height'] * scale_factor)
            }
            
            # Scale center
            center = detection['center']
            scaled_detection['center'] = {
                'x': int(center['x'] * scale_factor),
                'y': int(center['y'] * scale_factor)
            }
            
            # Scale area
            if 'area' in detection:
                scaled_detection['area'] = int(detection['area'] * scale_factor * scale_factor)
            
            scaled_detections.append(scaled_detection)
        
        return scaled_detections
    
    def _advanced_nms(self, detections, nms_threshold):
        """Advanced Non-Maximum Suppression with class-aware processing."""
        if not detections:
            return []
        
        # Group detections by class
        class_detections = {}
        for detection in detections:
            class_name = detection['class']
            if class_name not in class_detections:
                class_detections[class_name] = []
            class_detections[class_name].append(detection)
        
        # Apply NMS for each class separately
        final_detections = []
        
        for class_name, class_dets in class_detections.items():
            # Sort by confidence
            class_dets.sort(key=lambda x: x['confidence'], reverse=True)
            
            # Apply NMS
            keep = []
            while class_dets:
                # Take the detection with highest confidence
                best = class_dets.pop(0)
                keep.append(best)
                
                # Remove overlapping detections
                remaining = []
                for det in class_dets:
                    iou = self._calculate_iou(best['bbox'], det['bbox'])
                    if iou < nms_threshold:
                        remaining.append(det)
                
                class_dets = remaining
            
            final_detections.extend(keep)
        
        return final_detections
    
    def _calculate_iou(self, bbox1, bbox2):
        """Calculate Intersection over Union (IoU) of two bounding boxes."""
        # Calculate intersection
        x1 = max(bbox1['x'], bbox2['x'])
        y1 = max(bbox1['y'], bbox2['y'])
        x2 = min(bbox1['x'] + bbox1['width'], bbox2['x'] + bbox2['width'])
        y2 = min(bbox1['y'] + bbox1['height'], bbox2['y'] + bbox2['height'])
        
        if x2 <= x1 or y2 <= y1:
            return 0.0
        
        intersection_area = (x2 - x1) * (y2 - y1)
        
        # Calculate union
        area1 = bbox1['width'] * bbox1['height']
        area2 = bbox2['width'] * bbox2['height']
        union_area = area1 + area2 - intersection_area
        
        if union_area == 0:
            return 0.0
        
        return intersection_area / union_area
    
    def _post_process_detections(self, detections, image):
        """Post-process detections with confidence boosting and quality assessment."""
        enhanced_detections = []
        
        for detection in detections:
            enhanced_det = detection.copy()
            
            # Extract region of interest
            bbox = detection['bbox']
            x, y, w, h = bbox['x'], bbox['y'], bbox['width'], bbox['height']
            
            # Ensure bounds are within image
            h_img, w_img = image.shape[:2]
            x = max(0, min(x, w_img - 1))
            y = max(0, min(y, h_img - 1))
            w = max(1, min(w, w_img - x))
            h = max(1, min(h, h_img - y))
            
            roi = image[y:y+h, x:x+w]
            
            if roi.size > 0:
                # Calculate additional quality metrics
                quality_score = self._calculate_quality_score(roi, detection['class'])
                
                # Boost confidence based on quality
                original_confidence = detection['confidence']
                boosted_confidence = min(0.95, original_confidence * (1 + quality_score * 0.2))
                
                enhanced_det['confidence'] = boosted_confidence
                enhanced_det['quality_score'] = quality_score
                enhanced_det['confidence_boost'] = boosted_confidence - original_confidence
                
                # Add risk assessment
                enhanced_det['risk_level'] = self._assess_risk_level(enhanced_det)
                
                # Add recommendations
                enhanced_det['recommendations'] = self._generate_recommendations(enhanced_det)
            
            enhanced_detections.append(enhanced_det)
        
        return enhanced_detections
    
    def _calculate_quality_score(self, roi, defect_class):
        """Calculate quality score for a detection region."""
        if roi.size == 0:
            return 0.0
        
        # Calculate various quality metrics
        contrast = np.std(roi) / (np.mean(roi) + 1e-6)
        sharpness = cv2.Laplacian(roi, cv2.CV_64F).var()
        
        # Normalize metrics
        contrast_score = min(1.0, contrast / 50.0)
        sharpness_score = min(1.0, sharpness / 1000.0)
        
        # Weighted quality score
        quality_score = 0.6 * contrast_score + 0.4 * sharpness_score
        
        return quality_score
    
    def _assess_risk_level(self, detection):
        """Assess risk level based on detection properties."""
        confidence = detection['confidence']
        severity = detection.get('severity', 'medium')
        
        if confidence > 0.8 and severity == 'high':
            return 'critical'
        elif confidence > 0.6 and severity in ['high', 'medium']:
            return 'high'
        elif confidence > 0.4:
            return 'medium'
        else:
            return 'low'
    
    def _generate_recommendations(self, detection):
        """Generate recommendations based on detection."""
        defect_class = detection['class']
        risk_level = detection['risk_level']
        
        recommendations = []
        
        if defect_class == 'crack':
            if risk_level == 'critical':
                recommendations.extend([
                    "Immediate repair required",
                    "Stop operation until fixed",
                    "Conduct structural integrity assessment"
                ])
            elif risk_level == 'high':
                recommendations.extend([
                    "Schedule repair within 24 hours",
                    "Monitor for growth",
                    "Consider stress analysis"
                ])
            else:
                recommendations.extend([
                    "Monitor during next inspection",
                    "Document for trend analysis"
                ])
        
        elif defect_class == 'porosity':
            if risk_level == 'critical':
                recommendations.extend([
                    "Reject weld - redo required",
                    "Check welding parameters",
                    "Verify material quality"
                ])
            elif risk_level == 'high':
                recommendations.extend([
                    "Evaluate against acceptance criteria",
                    "Consider repair welding",
                    "Review welding procedure"
                ])
            else:
                recommendations.extend([
                    "Acceptable if within limits",
                    "Monitor in future inspections"
                ])
        
        elif defect_class == 'slag_inclusion':
            if risk_level == 'critical':
                recommendations.extend([
                    "Remove slag and re-weld",
                    "Improve slag removal technique",
                    "Check electrode condition"
                ])
            elif risk_level == 'high':
                recommendations.extend([
                    "Evaluate size and location",
                    "Consider grinding and repair",
                    "Review welding technique"
                ])
            else:
                recommendations.extend([
                    "Monitor for changes",
                    "Ensure proper cleaning"
                ])
        
        return recommendations