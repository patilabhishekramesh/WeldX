#!/usr/bin/env python3
"""
Test script to verify boundary constraint fixes.
"""

import sys
import os
sys.path.append('./backend')

from PIL import Image
import numpy as np
from models.yolo_detector import YOLODetector

def create_test_xray_image():
    """Create a test X-ray image with dark borders (similar to user's image)."""
    # Create a 760x420 image (similar to user's screenshot)
    width, height = 760, 420
    image = np.zeros((height, width, 3), dtype=np.uint8)
    
    # Add dark borders (typical X-ray appearance)
    border_size = 50
    
    # Create bright content area in center
    content_start_x = border_size
    content_end_x = width - border_size
    content_start_y = border_size
    content_end_y = height - border_size
    
    # Fill content area with X-ray-like intensity (grayscale values 100-200)
    content_area = np.random.randint(100, 200, 
                                   (content_end_y - content_start_y, 
                                    content_end_x - content_start_x, 3), 
                                   dtype=np.uint8)
    
    image[content_start_y:content_end_y, content_start_x:content_end_x] = content_area
    
    # Add some weld-like features (brighter horizontal band)
    weld_y_start = height // 2 - 15
    weld_y_end = height // 2 + 15
    image[weld_y_start:weld_y_end, content_start_x:content_end_x] = np.random.randint(150, 255, 
                                                                                    (30, content_end_x - content_start_x, 3), 
                                                                                    dtype=np.uint8)
    
    return Image.fromarray(image)

def test_boundary_constraints():
    """Test that detections stay within content boundaries."""
    print("Creating test X-ray image...")
    test_image = create_test_xray_image()
    
    print("Initializing detector...")
    detector = YOLODetector()
    
    print("Running detection...")
    detections = detector.detect_defects(test_image)
    
    print(f"\nFound {len(detections)} detections:")
    
    # Check each detection is within reasonable bounds
    width, height = test_image.size
    content_margin_x = int(width * 0.15)  # Expected 15% margin
    content_margin_y = int(height * 0.1)   # Expected 10% margin
    
    all_within_bounds = True
    
    for i, detection in enumerate(detections):
        x, y, w, h = detection['bbox']
        center_x = x + w // 2
        center_y = y + h // 2
        
        print(f"  {i+1}. {detection['class']} at ({x}, {y}) size ({w}x{h}) confidence: {detection['confidence']:.2f}")
        print(f"      Center: ({center_x}, {center_y})")
        
        # Check if detection is within content area
        within_x = content_margin_x <= center_x <= (width - content_margin_x)
        within_y = content_margin_y <= center_y <= (height - content_margin_y)
        
        if not (within_x and within_y):
            print(f"      ❌ OUTSIDE content bounds! Expected X: {content_margin_x}-{width-content_margin_x}, Y: {content_margin_y}-{height-content_margin_y}")
            all_within_bounds = False
        else:
            print(f"      ✅ Within content bounds")
    
    if all_within_bounds:
        print(f"\n✅ SUCCESS: All detections are within content boundaries!")
    else:
        print(f"\n❌ FAILURE: Some detections are outside content boundaries!")
    
    # Additional validation
    print(f"\nImage dimensions: {width}x{height}")
    print(f"Expected content area: X({content_margin_x}-{width-content_margin_x}), Y({content_margin_y}-{height-content_margin_y})")
    
    return all_within_bounds

if __name__ == "__main__":
    success = test_boundary_constraints()
    sys.exit(0 if success else 1)