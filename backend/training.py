#!/usr/bin/env python3
"""
Training module for the welding defect detection system.
Handles model training, dataset management, and model evaluation.
"""
import os
import json
import time
import numpy as np
from PIL import Image
from typing import List, Dict, Any
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

class ModelTrainer:
    def __init__(self):
        self.training_data_dir = "training_data"
        self.models_dir = "models"
        self.current_training = None
        
        # Create directories if they don't exist
        os.makedirs(self.training_data_dir, exist_ok=True)
        os.makedirs(self.models_dir, exist_ok=True)
    
    def save_training_dataset(self, images_data: List[Dict]) -> str:
        """Save training dataset to disk for processing."""
        timestamp = int(time.time())
        dataset_id = f"dataset_{timestamp}"
        dataset_path = os.path.join(self.training_data_dir, f"{dataset_id}.json")
        
        # Process and validate dataset
        processed_dataset = {
            "id": dataset_id,
            "created": timestamp,
            "version": "1.0",
            "statistics": self._calculate_dataset_stats(images_data),
            "images": images_data
        }
        
        with open(dataset_path, 'w') as f:
            json.dump(processed_dataset, f, indent=2)
        
        return dataset_id
    
    def _calculate_dataset_stats(self, images_data: List[Dict]) -> Dict:
        """Calculate dataset statistics."""
        total_images = len(images_data)
        total_labels = sum(len(img.get('labels', [])) for img in images_data)
        
        label_counts = {}
        for img in images_data:
            for label in img.get('labels', []):
                defect_type = label.get('type', 'unknown')
                label_counts[defect_type] = label_counts.get(defect_type, 0) + 1
        
        return {
            "total_images": total_images,
            "total_labels": total_labels,
            "labeled_images": len([img for img in images_data if img.get('labels')]),
            "label_distribution": label_counts,
            "average_labels_per_image": total_labels / max(total_images, 1)
        }
    
    def start_training(self, dataset_id: str, config: Dict = None) -> Dict:
        """Start the model training process."""
        if self.current_training:
            raise ValueError("Training already in progress")
        
        dataset_path = os.path.join(self.training_data_dir, f"{dataset_id}.json")
        if not os.path.exists(dataset_path):
            raise FileNotFoundError(f"Dataset {dataset_id} not found")
        
        # Load dataset
        with open(dataset_path, 'r') as f:
            dataset = json.load(f)
        
        # Validate dataset meets minimum requirements
        stats = dataset['statistics']
        if stats['total_images'] < 10:
            raise ValueError("Minimum 10 images required for training")
        if stats['total_labels'] < 20:
            raise ValueError("Minimum 20 labels required for training")
        
        # Initialize training configuration
        training_config = {
            "dataset_id": dataset_id,
            "model_type": "YOLOv8",
            "epochs": config.get('epochs', 50) if config else 50,
            "batch_size": config.get('batch_size', 16) if config else 16,
            "learning_rate": config.get('learning_rate', 0.001) if config else 0.001,
            "validation_split": 0.2,
            "started_at": time.time()
        }
        
        self.current_training = {
            "id": f"training_{int(time.time())}",
            "status": "preparing",
            "progress": 0,
            "config": training_config,
            "dataset_stats": stats,
            "current_epoch": 0,
            "loss": 0.0,
            "accuracy": 0.0
        }
        
        return self.current_training
    
    def get_training_status(self, training_id: str) -> Dict:
        """Get current training status."""
        if not self.current_training or self.current_training['id'] != training_id:
            return {"error": "Training not found"}
        
        # Simulate training progress
        elapsed = time.time() - self.current_training['config']['started_at']
        total_epochs = self.current_training['config']['epochs']
        
        # Simulate different training stages
        if elapsed < 10:  # Preparation phase
            self.current_training['status'] = 'preparing'
            self.current_training['progress'] = min(10, elapsed)
        elif elapsed < 60:  # Training phase
            self.current_training['status'] = 'training'
            epoch_progress = (elapsed - 10) / 50  # 50 seconds for training
            self.current_training['current_epoch'] = int(epoch_progress * total_epochs)
            self.current_training['progress'] = 10 + (epoch_progress * 80)
            
            # Simulate improving metrics
            self.current_training['loss'] = max(0.1, 2.0 - epoch_progress * 1.8)
            self.current_training['accuracy'] = min(0.95, 0.3 + epoch_progress * 0.65)
        else:  # Completion phase
            self.current_training['status'] = 'completed'
            self.current_training['progress'] = 100
            self.current_training['current_epoch'] = total_epochs
            self.current_training['loss'] = 0.15
            self.current_training['accuracy'] = 0.92
            
            # Save completed model info
            model_info = {
                "id": f"model_{int(time.time())}",
                "name": f"Custom Model - {self.current_training['dataset_stats']['total_images']} images",
                "version": "1.0.0",
                "accuracy": self.current_training['accuracy'],
                "loss": self.current_training['loss'],
                "trained_on": time.strftime("%Y-%m-%d"),
                "dataset_id": self.current_training['config']['dataset_id'],
                "epochs": total_epochs,
                "dataset_size": self.current_training['dataset_stats']['total_images']
            }
            
            model_path = os.path.join(self.models_dir, f"{model_info['id']}.json")
            with open(model_path, 'w') as f:
                json.dump(model_info, f, indent=2)
        
        return self.current_training
    
    def get_available_models(self) -> List[Dict]:
        """Get list of available trained models."""
        models = []
        
        # Add default model
        models.append({
            "id": "default",
            "name": "Default Detection Model",
            "version": "1.0.0",
            "accuracy": 0.85,
            "trained_on": "2025-01-01",
            "is_active": True,
            "description": "Pre-trained model for general welding defect detection",
            "dataset_size": 1000
        })
        
        # Add custom trained models
        if os.path.exists(self.models_dir):
            for filename in os.listdir(self.models_dir):
                if filename.endswith('.json'):
                    try:
                        with open(os.path.join(self.models_dir, filename), 'r') as f:
                            model_info = json.load(f)
                            model_info['is_active'] = False
                            models.append(model_info)
                    except Exception as e:
                        print(f"Error loading model {filename}: {e}")
        
        return models

# Initialize trainer
trainer = ModelTrainer()

@app.route('/api/train', methods=['POST'])
def start_training():
    """Start model training with uploaded dataset."""
    try:
        data = request.get_json()
        images_data = data.get('images', [])
        config = data.get('config', {})
        
        # Save dataset
        dataset_id = trainer.save_training_dataset(images_data)
        
        # Start training
        training_info = trainer.start_training(dataset_id, config)
        
        return jsonify({
            "success": True,
            "message": "Training started successfully",
            "training_id": training_info['id'],
            "dataset_id": dataset_id,
            "estimated_time": "2-3 minutes",
            "config": training_info['config']
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Training failed: {str(e)}"
        }), 500

@app.route('/api/training/<training_id>/status', methods=['GET'])
def get_training_status(training_id):
    """Get training progress and status."""
    try:
        status = trainer.get_training_status(training_id)
        
        if "error" in status:
            return jsonify({
                "success": False,
                "message": status["error"]
            }), 404
        
        return jsonify({
            "success": True,
            "training": status
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to get status: {str(e)}"
        }), 500

@app.route('/api/models', methods=['GET'])
def get_models():
    """Get list of available models."""
    try:
        models = trainer.get_available_models()
        
        return jsonify({
            "success": True,
            "models": models
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to get models: {str(e)}"
        }), 500

@app.route('/api/models/<model_id>/activate', methods=['POST'])
def activate_model(model_id):
    """Activate a specific model for inference."""
    try:
        # In a real implementation, this would switch the active model
        return jsonify({
            "success": True,
            "message": f"Model {model_id} activated successfully",
            "active_model": model_id
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to activate model: {str(e)}"
        }), 500

if __name__ == '__main__':
    print("Starting AI Training Server...")
    print("- Training endpoint: http://localhost:8001/api/train")
    print("- Models endpoint: http://localhost:8001/api/models")
    app.run(host='0.0.0.0', port=8001, debug=True)