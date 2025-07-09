import os
import io
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from PIL import Image
import numpy as np

from models.yolo_detector import YOLODetector
from models.enhanced_yolo_detector import EnhancedYOLODetector
from advanced_training_system import training_system
from utils.image_processor import ImageProcessor

app = Flask(__name__)
CORS(app)

# Initialize detectors
detector = YOLODetector()
enhanced_detector = EnhancedYOLODetector()
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
        
        # Get analysis parameters from request
        enhancement_mode = request.form.get('enhancement_mode', 'advanced')
        confidence_threshold = float(request.form.get('confidence_threshold', 0.5))
        use_enhanced = request.form.get('use_enhanced', 'true').lower() == 'true'
        
        # Run defect detection with enhanced capabilities
        if use_enhanced:
            detections = enhanced_detector.detect_defects(image, enhancement_mode, confidence_threshold)
        else:
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

@app.route('/api/train', methods=['POST'])
def train_model():
    """Train a new model with uploaded training data."""
    try:
        # Get training data from request
        training_data = request.json.get('training_data', [])
        model_config = request.json.get('config', {})
        
        if not training_data:
            return jsonify({
                'success': False,
                'message': 'No training data provided'
            }), 400
        
        # Prepare dataset
        dataset_info = training_system.prepare_training_dataset(training_data)
        
        if dataset_info['total_features'] == 0:
            return jsonify({
                'success': False,
                'message': 'No valid features extracted from training data'
            }), 400
        
        # Train model
        training_result = training_system.train_model(dataset_info['dataset_id'], model_config)
        
        return jsonify({
            'success': training_result['success'],
            'training_id': training_result['training_id'],
            'metrics': training_result.get('metrics', {}),
            'training_time': training_result.get('training_time', 0),
            'dataset_info': dataset_info
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Training failed: {str(e)}'
        }), 500

@app.route('/api/models', methods=['GET'])
def get_models():
    """Get list of available trained models."""
    try:
        models = training_system.get_training_history()
        return jsonify({
            'success': True,
            'models': models
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to get models: {str(e)}'
        }), 500

@app.route('/api/models/<model_id>', methods=['GET'])
def get_model_info(model_id):
    """Get information about a specific model."""
    try:
        model_info = training_system.get_model_info(model_id)
        
        if not model_info:
            return jsonify({
                'success': False,
                'message': 'Model not found'
            }), 404
        
        return jsonify({
            'success': True,
            'model_info': model_info
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to get model info: {str(e)}'
        }), 500

@app.route('/api/models/<model_id>/predict', methods=['POST'])
def predict_with_model(model_id):
    """Use a specific trained model for prediction."""
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No file provided'
            }), 400

        file = request.files['file']
        
        # Check file type
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'message': 'File type not allowed. Please use JPEG or PNG.'
            }), 400

        # Read and process the image
        image_data = file.read()
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert to numpy array
        image_array = np.array(image)
        
        # Make prediction with trained model
        predictions = training_system.predict_defects(image_array, model_id)
        
        return jsonify({
            'success': True,
            'predictions': predictions,
            'model_id': model_id
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Prediction failed: {str(e)}'
        }), 500

@app.route('/api/continuous-learning', methods=['POST'])
def continuous_learning():
    """Implement continuous learning with new data."""
    try:
        new_data = request.json.get('new_data', [])
        model_id = request.json.get('model_id', '')
        
        if not new_data or not model_id:
            return jsonify({
                'success': False,
                'message': 'New data and model ID required'
            }), 400
        
        # Perform continuous learning
        result = training_system.continuous_learning(new_data, model_id)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Continuous learning failed: {str(e)}'
        }), 500

@app.route('/api/evaluate', methods=['POST'])
def evaluate_model():
    """Evaluate model performance on test data."""
    try:
        test_data = request.json.get('test_data', [])
        model_id = request.json.get('model_id', '')
        
        if not test_data or not model_id:
            return jsonify({
                'success': False,
                'message': 'Test data and model ID required'
            }), 400
        
        # Evaluate model
        evaluation_result = training_system.evaluate_model_performance(model_id, test_data)
        
        return jsonify(evaluation_result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Evaluation failed: {str(e)}'
        }), 500

@app.route('/api/analyze-advanced', methods=['POST'])
def analyze_advanced():
    """Advanced analysis with multiple enhancement modes and detailed results."""
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No file provided'
            }), 400

        file = request.files['file']
        
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
        
        # Get advanced analysis parameters
        enhancement_modes = request.form.get('enhancement_modes', 'standard,advanced,high_sensitivity').split(',')
        confidence_threshold = float(request.form.get('confidence_threshold', 0.5))
        include_recommendations = request.form.get('include_recommendations', 'true').lower() == 'true'
        
        # Run analysis with multiple enhancement modes
        results = {}
        
        for mode in enhancement_modes:
            mode = mode.strip()
            detections = enhanced_detector.detect_defects(image, mode, confidence_threshold)
            
            # Process results
            processed_results = image_processor.process_detections(detections, image.width, image.height)
            
            results[mode] = {
                'detections': processed_results['detections'],
                'summary': processed_results
            }
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        # Get image info
        image_info = {
            'filename': secure_filename(file.filename),
            'width': image.width,
            'height': image.height,
            'format': image.format or 'JPEG',
            'size_bytes': len(image_data)
        }
        
        # Prepare advanced response
        response = {
            'success': True,
            'message': 'Advanced analysis completed successfully',
            'image_info': image_info,
            'results': results,
            'processing_time': processing_time,
            'enhancement_modes_used': enhancement_modes,
            'confidence_threshold': confidence_threshold
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Advanced analysis failed: {str(e)}'
        }), 500

@app.route('/api/batch-analyze', methods=['POST'])
def batch_analyze():
    """Batch analysis of multiple images."""
    try:
        # Check if files are present
        if 'files' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No files provided'
            }), 400

        files = request.files.getlist('files')
        
        if not files:
            return jsonify({
                'success': False,
                'message': 'No files selected'
            }), 400
        
        # Get analysis parameters
        enhancement_mode = request.form.get('enhancement_mode', 'advanced')
        confidence_threshold = float(request.form.get('confidence_threshold', 0.5))
        
        # Process each file
        results = []
        total_start_time = time.time()
        
        for file in files:
            if file.filename == '' or not allowed_file(file.filename):
                continue
            
            try:
                # Start processing timer for this file
                start_time = time.time()
                
                # Read and process the image
                image_data = file.read()
                image = Image.open(io.BytesIO(image_data))
                
                # Convert to RGB if necessary
                if image.mode != 'RGB':
                    image = image.convert('RGB')
                
                # Run defect detection
                detections = enhanced_detector.detect_defects(image, enhancement_mode, confidence_threshold)
                
                # Process results
                processed_results = image_processor.process_detections(detections, image.width, image.height)
                
                # Calculate processing time
                processing_time = time.time() - start_time
                
                # Get image info
                image_info = {
                    'filename': secure_filename(file.filename),
                    'width': image.width,
                    'height': image.height,
                    'format': image.format or 'JPEG',
                    'size_bytes': len(image_data)
                }
                
                # Add to results
                results.append({
                    'image_info': image_info,
                    'detections': processed_results['detections'],
                    'summary': {
                        'total_defects': processed_results['total_defects'],
                        'defect_types': processed_results['defect_types'],
                        'average_confidence': processed_results['average_confidence'],
                        'processing_time': processing_time
                    }
                })
                
            except Exception as e:
                results.append({
                    'filename': file.filename,
                    'error': str(e)
                })
        
        # Calculate total processing time
        total_processing_time = time.time() - total_start_time
        
        # Prepare batch response
        response = {
            'success': True,
            'message': f'Batch analysis completed for {len(results)} images',
            'results': results,
            'total_processing_time': total_processing_time,
            'enhancement_mode': enhancement_mode,
            'confidence_threshold': confidence_threshold
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Batch analysis failed: {str(e)}'
        }), 500

@app.errorhandler(413)
def too_large(e):
    return jsonify({
        'success': False,
        'message': 'File too large. Maximum size is 10MB.'
    }), 413

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
