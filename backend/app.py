import os
import io
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from PIL import Image
import numpy as np

from models.yolo_detector import YOLODetector
from utils.image_processor import ImageProcessor

app = Flask(__name__)
CORS(app)

# Initialize the detector
detector = YOLODetector()
image_processor = ImageProcessor()

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'AI Welding Defect Detection API is running',
        'timestamp': time.time()
    })

@app.route('/api/analyze', methods=['POST'])
def analyze_image():
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No file provided'
            }), 400

        file = request.files['file']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({
                'success': False,
                'message': 'No file selected'
            }), 400

        # Check file type
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'message': 'File type not allowed. Please use JPEG or PNG.'
            }), 400

        # Start processing timer
        start_time = time.time()
        
        # Read and process the image
        image_data = file.read()
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Get image info
        image_info = {
            'filename': secure_filename(file.filename),
            'width': image.width,
            'height': image.height,
            'format': image.format or 'JPEG',
            'size_bytes': len(image_data)
        }
        
        # Run defect detection
        detections = detector.detect_defects(image)
        
        # Process results
        processed_results = image_processor.process_detections(detections, image.width, image.height)
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        # Prepare response
        response = {
            'success': True,
            'message': 'Analysis completed successfully',
            'image_info': image_info,
            'detections': processed_results['detections'],
            'summary': {
                'total_defects': processed_results['total_defects'],
                'defect_types': processed_results['defect_types'],
                'average_confidence': processed_results['average_confidence'],
                'processing_time': processing_time
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Analysis failed: {str(e)}'
        }), 500

@app.errorhandler(413)
def too_large(e):
    return jsonify({
        'success': False,
        'message': 'File too large. Maximum size is 10MB.'
    }), 413

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
