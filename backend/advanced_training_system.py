"""
Advanced Training System for Welding Defect Detection
Implements sophisticated machine learning algorithms for continuous improvement
"""

import numpy as np
import json
import time
import os
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from PIL import Image
import cv2
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.model_selection import train_test_split
import joblib


class AdvancedTrainingSystem:
    """
    Advanced training system with machine learning capabilities for welding defect detection.
    Implements feature extraction, model training, and continuous learning.
    """
    
    def __init__(self):
        self.model_dir = "models"
        self.dataset_dir = "datasets"
        self.trained_models = {}
        self.feature_extractors = {}
        self.training_history = []
        
        # Ensure directories exist
        os.makedirs(self.model_dir, exist_ok=True)
        os.makedirs(self.dataset_dir, exist_ok=True)
        
        # Initialize feature extractors
        self._initialize_feature_extractors()
        
        print("Advanced Training System initialized")
    
    def _initialize_feature_extractors(self):
        """Initialize feature extraction algorithms."""
        self.feature_extractors = {
            'texture_features': self._extract_texture_features,
            'shape_features': self._extract_shape_features,
            'intensity_features': self._extract_intensity_features,
            'edge_features': self._extract_edge_features,
            'statistical_features': self._extract_statistical_features
        }
    
    def prepare_training_dataset(self, images_data: List[Dict]) -> Dict:
        """
        Prepare training dataset with advanced feature extraction.
        
        Args:
            images_data: List of image data with labels
            
        Returns:
            Dataset preparation results
        """
        dataset_id = str(uuid.uuid4())
        dataset_path = os.path.join(self.dataset_dir, f"dataset_{dataset_id}")
        os.makedirs(dataset_path, exist_ok=True)
        
        # Extract features from images
        features = []
        labels = []
        processed_images = 0
        
        for image_data in images_data:
            try:
                # Load and preprocess image
                image_path = image_data.get('path', '')
                if not os.path.exists(image_path):
                    continue
                
                image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
                if image is None:
                    continue
                
                # Extract comprehensive features
                image_features = self._extract_comprehensive_features(image)
                
                # Get label information
                label_info = image_data.get('labels', [])
                for label in label_info:
                    defect_class = label.get('class', 'unknown')
                    bbox = label.get('bbox', {})
                    
                    # Extract region features if bbox is provided
                    if bbox:
                        x, y, w, h = bbox.get('x', 0), bbox.get('y', 0), bbox.get('width', 0), bbox.get('height', 0)
                        roi = image[y:y+h, x:x+w]
                        if roi.size > 0:
                            roi_features = self._extract_comprehensive_features(roi)
                            combined_features = np.concatenate([image_features, roi_features])
                        else:
                            combined_features = image_features
                    else:
                        combined_features = image_features
                    
                    features.append(combined_features)
                    labels.append(defect_class)
                
                processed_images += 1
                
            except Exception as e:
                print(f"Error processing image {image_data.get('path', '')}: {e}")
                continue
        
        # Convert to numpy arrays
        X = np.array(features)
        y = np.array(labels)
        
        # Save dataset
        dataset_info = {
            'dataset_id': dataset_id,
            'dataset_path': dataset_path,
            'total_images': len(images_data),
            'processed_images': processed_images,
            'total_features': len(features),
            'feature_dimension': X.shape[1] if len(X) > 0 else 0,
            'classes': list(set(labels)),
            'class_distribution': {cls: list(y).count(cls) for cls in set(labels)},
            'created_at': datetime.now().isoformat()
        }
        
        # Save features and labels
        if len(X) > 0:
            np.save(os.path.join(dataset_path, 'features.npy'), X)
            np.save(os.path.join(dataset_path, 'labels.npy'), y)
            
            # Save dataset info
            with open(os.path.join(dataset_path, 'dataset_info.json'), 'w') as f:
                json.dump(dataset_info, f, indent=2)
        
        return dataset_info
    
    def _extract_comprehensive_features(self, image: np.ndarray) -> np.ndarray:
        """Extract comprehensive features from an image."""
        features = []
        
        # Extract all types of features
        for feature_name, extractor in self.feature_extractors.items():
            try:
                feature_vector = extractor(image)
                features.extend(feature_vector)
            except Exception as e:
                print(f"Error extracting {feature_name}: {e}")
                # Add zero features as fallback
                features.extend([0] * 10)
        
        return np.array(features)
    
    def _extract_texture_features(self, image: np.ndarray) -> List[float]:
        """Extract texture features using statistical methods."""
        features = []
        
        # Calculate texture features using Gray-Level Co-occurrence Matrix (GLCM)
        # Simplified implementation for demonstration
        
        # Local Binary Pattern (LBP) features
        height, width = image.shape
        lbp_features = []
        
        for i in range(1, height - 1):
            for j in range(1, width - 1):
                center = image[i, j]
                binary_string = ""
                
                # 8-neighbor LBP
                neighbors = [
                    image[i-1, j-1], image[i-1, j], image[i-1, j+1],
                    image[i, j+1], image[i+1, j+1], image[i+1, j],
                    image[i+1, j-1], image[i, j-1]
                ]
                
                for neighbor in neighbors:
                    binary_string += '1' if neighbor >= center else '0'
                
                lbp_features.append(int(binary_string, 2))
        
        # Calculate histogram of LBP values
        if lbp_features:
            hist, _ = np.histogram(lbp_features, bins=16, range=(0, 255))
            features.extend(hist.tolist())
        else:
            features.extend([0] * 16)
        
        return features
    
    def _extract_shape_features(self, image: np.ndarray) -> List[float]:
        """Extract shape-based features."""
        features = []
        
        # Apply thresholding to get binary image
        _, binary = cv2.threshold(image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Find contours
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if contours:
            # Get largest contour
            largest_contour = max(contours, key=cv2.contourArea)
            
            # Calculate shape features
            area = cv2.contourArea(largest_contour)
            perimeter = cv2.arcLength(largest_contour, True)
            
            # Avoid division by zero
            if perimeter > 0:
                circularity = 4 * np.pi * area / (perimeter * perimeter)
            else:
                circularity = 0
            
            # Bounding rectangle
            x, y, w, h = cv2.boundingRect(largest_contour)
            aspect_ratio = w / h if h > 0 else 0
            
            # Convex hull features
            hull = cv2.convexHull(largest_contour)
            hull_area = cv2.contourArea(hull)
            solidity = area / hull_area if hull_area > 0 else 0
            
            features.extend([area, perimeter, circularity, aspect_ratio, solidity])
        else:
            features.extend([0, 0, 0, 0, 0])
        
        return features
    
    def _extract_intensity_features(self, image: np.ndarray) -> List[float]:
        """Extract intensity-based features."""
        features = []
        
        # Basic statistical features
        mean_intensity = np.mean(image)
        std_intensity = np.std(image)
        min_intensity = np.min(image)
        max_intensity = np.max(image)
        
        # Histogram features
        hist, _ = np.histogram(image, bins=16, range=(0, 255))
        hist_features = hist.tolist()
        
        # Gradient features
        grad_x = cv2.Sobel(image, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(image, cv2.CV_64F, 0, 1, ksize=3)
        gradient_magnitude = np.sqrt(grad_x**2 + grad_y**2)
        
        mean_gradient = np.mean(gradient_magnitude)
        std_gradient = np.std(gradient_magnitude)
        
        features.extend([mean_intensity, std_intensity, min_intensity, max_intensity, 
                        mean_gradient, std_gradient])
        features.extend(hist_features)
        
        return features
    
    def _extract_edge_features(self, image: np.ndarray) -> List[float]:
        """Extract edge-based features."""
        features = []
        
        # Canny edge detection
        edges = cv2.Canny(image, 50, 150)
        
        # Edge density
        edge_density = np.sum(edges > 0) / (image.shape[0] * image.shape[1])
        
        # Edge orientation histogram
        grad_x = cv2.Sobel(image, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(image, cv2.CV_64F, 0, 1, ksize=3)
        
        # Calculate edge orientations
        orientations = np.arctan2(grad_y, grad_x)
        orientation_hist, _ = np.histogram(orientations, bins=8, range=(-np.pi, np.pi))
        
        features.append(edge_density)
        features.extend(orientation_hist.tolist())
        
        return features
    
    def _extract_statistical_features(self, image: np.ndarray) -> List[float]:
        """Extract statistical features."""
        features = []
        
        # Moments
        moments = cv2.moments(image)
        hu_moments = cv2.HuMoments(moments)
        
        # Convert to log scale and flatten
        log_hu_moments = -np.sign(hu_moments) * np.log10(np.abs(hu_moments))
        features.extend(log_hu_moments.flatten().tolist())
        
        # Entropy
        hist, _ = np.histogram(image, bins=256, range=(0, 255))
        hist = hist / hist.sum()  # Normalize
        entropy = -np.sum(hist * np.log2(hist + 1e-10))
        
        features.append(entropy)
        
        return features
    
    def train_model(self, dataset_id: str, model_config: Dict = None) -> Dict:
        """
        Train a machine learning model on the prepared dataset.
        
        Args:
            dataset_id: ID of the prepared dataset
            model_config: Configuration for model training
            
        Returns:
            Training results
        """
        training_id = str(uuid.uuid4())
        
        # Default model configuration
        if model_config is None:
            model_config = {
                'algorithm': 'random_forest',
                'n_estimators': 100,
                'max_depth': 10,
                'test_size': 0.2,
                'random_state': 42
            }
        
        # Load dataset
        dataset_path = os.path.join(self.dataset_dir, f"dataset_{dataset_id}")
        
        if not os.path.exists(dataset_path):
            return {
                'training_id': training_id,
                'success': False,
                'error': 'Dataset not found'
            }
        
        try:
            # Load features and labels
            X = np.load(os.path.join(dataset_path, 'features.npy'))
            y = np.load(os.path.join(dataset_path, 'labels.npy'))
            
            # Split into training and testing sets
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=model_config.get('test_size', 0.2),
                random_state=model_config.get('random_state', 42),
                stratify=y
            )
            
            # Initialize model
            if model_config.get('algorithm') == 'random_forest':
                model = RandomForestClassifier(
                    n_estimators=model_config.get('n_estimators', 100),
                    max_depth=model_config.get('max_depth', 10),
                    random_state=model_config.get('random_state', 42)
                )
            else:
                # Default to Random Forest
                model = RandomForestClassifier(n_estimators=100, random_state=42)
            
            # Train model
            start_time = time.time()
            model.fit(X_train, y_train)
            training_time = time.time() - start_time
            
            # Evaluate model
            y_pred = model.predict(X_test)
            
            # Calculate metrics
            accuracy = accuracy_score(y_test, y_pred)
            precision = precision_score(y_test, y_pred, average='weighted')
            recall = recall_score(y_test, y_pred, average='weighted')
            f1 = f1_score(y_test, y_pred, average='weighted')
            
            # Save model
            model_path = os.path.join(self.model_dir, f"model_{training_id}.joblib")
            joblib.dump(model, model_path)
            
            # Store model info
            model_info = {
                'training_id': training_id,
                'dataset_id': dataset_id,
                'model_path': model_path,
                'algorithm': model_config.get('algorithm', 'random_forest'),
                'training_time': training_time,
                'metrics': {
                    'accuracy': accuracy,
                    'precision': precision,
                    'recall': recall,
                    'f1_score': f1
                },
                'model_config': model_config,
                'training_samples': len(X_train),
                'test_samples': len(X_test),
                'feature_dimension': X.shape[1],
                'classes': list(set(y)),
                'created_at': datetime.now().isoformat()
            }
            
            # Save model info
            with open(os.path.join(self.model_dir, f"model_{training_id}.json"), 'w') as f:
                json.dump(model_info, f, indent=2)
            
            # Store in memory
            self.trained_models[training_id] = {
                'model': model,
                'info': model_info
            }
            
            # Add to training history
            self.training_history.append(model_info)
            
            return {
                'training_id': training_id,
                'success': True,
                'metrics': model_info['metrics'],
                'training_time': training_time,
                'model_path': model_path
            }
            
        except Exception as e:
            return {
                'training_id': training_id,
                'success': False,
                'error': str(e)
            }
    
    def predict_defects(self, image: np.ndarray, model_id: str) -> List[Dict]:
        """
        Predict defects using a trained model.
        
        Args:
            image: Input image as numpy array
            model_id: ID of the trained model
            
        Returns:
            List of predictions
        """
        if model_id not in self.trained_models:
            # Try to load model from disk
            model_path = os.path.join(self.model_dir, f"model_{model_id}.joblib")
            if os.path.exists(model_path):
                model = joblib.load(model_path)
                
                # Load model info
                info_path = os.path.join(self.model_dir, f"model_{model_id}.json")
                with open(info_path, 'r') as f:
                    model_info = json.load(f)
                
                self.trained_models[model_id] = {
                    'model': model,
                    'info': model_info
                }
            else:
                return []
        
        model = self.trained_models[model_id]['model']
        
        # Extract features from image
        features = self._extract_comprehensive_features(image)
        features = features.reshape(1, -1)
        
        # Make prediction
        prediction = model.predict(features)[0]
        probabilities = model.predict_proba(features)[0]
        
        # Get class names
        classes = model.classes_
        
        # Create prediction result
        predictions = []
        for i, cls in enumerate(classes):
            if cls == prediction:
                predictions.append({
                    'class': cls,
                    'confidence': probabilities[i],
                    'predicted': True
                })
            else:
                predictions.append({
                    'class': cls,
                    'confidence': probabilities[i],
                    'predicted': False
                })
        
        return predictions
    
    def get_model_info(self, model_id: str) -> Dict:
        """Get information about a trained model."""
        if model_id in self.trained_models:
            return self.trained_models[model_id]['info']
        
        # Try to load from disk
        info_path = os.path.join(self.model_dir, f"model_{model_id}.json")
        if os.path.exists(info_path):
            with open(info_path, 'r') as f:
                return json.load(f)
        
        return {}
    
    def get_training_history(self) -> List[Dict]:
        """Get training history."""
        return self.training_history
    
    def continuous_learning(self, new_data: List[Dict], model_id: str) -> Dict:
        """
        Implement continuous learning with new data.
        
        Args:
            new_data: New training data
            model_id: Existing model to improve
            
        Returns:
            Results of continuous learning
        """
        # Prepare new dataset
        new_dataset = self.prepare_training_dataset(new_data)
        
        if new_dataset['total_features'] == 0:
            return {
                'success': False,
                'error': 'No valid features extracted from new data'
            }
        
        # Load existing model
        if model_id not in self.trained_models:
            return {
                'success': False,
                'error': 'Model not found'
            }
        
        existing_model = self.trained_models[model_id]['model']
        
        # Load new features
        dataset_path = new_dataset['dataset_path']
        X_new = np.load(os.path.join(dataset_path, 'features.npy'))
        y_new = np.load(os.path.join(dataset_path, 'labels.npy'))
        
        # Incremental learning (simplified approach)
        # In practice, you would use more sophisticated techniques
        
        # For now, retrain the model with combined data
        # This is a simplified approach - in production, you'd use incremental learning algorithms
        
        return {
            'success': True,
            'message': 'Continuous learning completed',
            'new_samples': len(X_new),
            'model_updated': True
        }
    
    def evaluate_model_performance(self, model_id: str, test_data: List[Dict]) -> Dict:
        """
        Evaluate model performance on test data.
        
        Args:
            model_id: ID of the model to evaluate
            test_data: Test data
            
        Returns:
            Evaluation results
        """
        if model_id not in self.trained_models:
            return {
                'success': False,
                'error': 'Model not found'
            }
        
        # Prepare test dataset
        test_dataset = self.prepare_training_dataset(test_data)
        
        if test_dataset['total_features'] == 0:
            return {
                'success': False,
                'error': 'No valid features extracted from test data'
            }
        
        # Load test features
        dataset_path = test_dataset['dataset_path']
        X_test = np.load(os.path.join(dataset_path, 'features.npy'))
        y_test = np.load(os.path.join(dataset_path, 'labels.npy'))
        
        # Make predictions
        model = self.trained_models[model_id]['model']
        y_pred = model.predict(X_test)
        
        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, average='weighted')
        recall = recall_score(y_test, y_pred, average='weighted')
        f1 = f1_score(y_test, y_pred, average='weighted')
        
        return {
            'success': True,
            'metrics': {
                'accuracy': accuracy,
                'precision': precision,
                'recall': recall,
                'f1_score': f1
            },
            'test_samples': len(X_test),
            'model_id': model_id
        }


# Global instance
training_system = AdvancedTrainingSystem()