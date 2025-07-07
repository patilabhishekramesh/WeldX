#!/usr/bin/env python3
"""
Create sample X-ray images for testing the welding defect detection system.
"""
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
import os

def create_xray_with_defects():
    """Create a realistic X-ray image with simulated welding defects."""
    # Create base X-ray image
    width, height = 1024, 768
    img = Image.new('L', (width, height), color=80)  # Dark background
    draw = ImageDraw.Draw(img)
    
    # Add weld seam (bright line in center)
    weld_y = height // 2
    draw.rectangle([0, weld_y-20, width, weld_y+20], fill=160)
    
    # Add some texture noise
    img_array = np.array(img)
    noise = np.random.normal(0, 15, img_array.shape)
    img_array = np.clip(img_array + noise, 0, 255).astype(np.uint8)
    
    # Add simulated defects
    # 1. Crack (dark linear feature)
    draw.line([(300, weld_y-5), (350, weld_y+8)], fill=40, width=3)
    
    # 2. Porosity (dark circular spots)
    for i, (x, y) in enumerate([(450, weld_y-10), (480, weld_y+5), (520, weld_y-8)]):
        radius = 8 + i * 2
        draw.ellipse([x-radius, y-radius, x+radius, y+radius], fill=30)
    
    # 3. Slag inclusion (irregular bright spot)
    points = [(600, weld_y-5), (615, weld_y-8), (625, weld_y+2), (610, weld_y+6), (595, weld_y+3)]
    draw.polygon(points, fill=200)
    
    # Apply slight blur for realism
    img = img.filter(ImageFilter.GaussianBlur(radius=1))
    
    return img

def create_clean_xray():
    """Create an X-ray image with no defects."""
    width, height = 800, 600
    img = Image.new('L', (width, height), color=90)
    draw = ImageDraw.Draw(img)
    
    # Add clean weld seam
    weld_y = height // 2
    draw.rectangle([0, weld_y-15, width, weld_y+15], fill=150)
    
    # Add texture
    img_array = np.array(img)
    noise = np.random.normal(0, 8, img_array.shape)
    img_array = np.clip(img_array + noise, 0, 255).astype(np.uint8)
    
    img = Image.fromarray(img_array)
    img = img.filter(ImageFilter.GaussianBlur(radius=0.5))
    
    return img

def main():
    # Create demo images
    print("Creating demo X-ray images...")
    
    # Image with defects
    defective_img = create_xray_with_defects()
    defective_img.save('demo_xray_with_defects.jpg', 'JPEG', quality=85)
    print("✓ Created: demo_xray_with_defects.jpg")
    
    # Clean image
    clean_img = create_clean_xray()
    clean_img.save('demo_xray_clean.jpg', 'JPEG', quality=85)
    print("✓ Created: demo_xray_clean.jpg")
    
    print("\nDemo images created successfully!")
    print("You can now upload these images to test the welding defect detection system.")

if __name__ == '__main__':
    main()