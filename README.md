# AI Welding Defect Detection System

A full-stack AI-powered system for detecting and analyzing welding defects in radiographic (X-ray) images. Built with React, Node.js, Python, and advanced image processing algorithms.

## Features

- **Real-time Defect Detection**: Detects cracks, porosity, and slag inclusions in X-ray images
- **Advanced Image Processing**: Sophisticated algorithms including edge detection, morphological operations, and blob detection
- **Interactive Visualization**: Visual overlay of detected defects with bounding boxes and confidence scores
- **Professional UI**: Modern, responsive interface with dark/light mode support
- **Detailed Analysis Reports**: Exportable reports with recommendations and detailed findings
- **Advanced Settings**: Configurable detection sensitivity, analysis modes, and confidence thresholds
- **Dual Backend Architecture**: Python AI engine with Node.js fallback for reliability

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Radix UI** components for accessibility
- **TanStack React Query** for state management
- **Wouter** for client-side routing
- **Vite** for build tooling

### Backend
- **Node.js/Express** for API server
- **Python Flask** for AI processing
- **Advanced Image Processing** with custom algorithms
- **Multi-format Support** (JPEG, PNG)

## Prerequisites

Before installation, ensure you have the following installed:

- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)
- **Python** (version 3.11 or higher)
- **Git** (for cloning the repository)

## Local Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ai-welding-defect-detection
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
cd ..
```

### 4. Environment Setup

Create a `.env` file in the root directory (optional):

```env
NODE_ENV=development
PORT=5000
PYTHON_BACKEND_PORT=8000
```

## Running the Application

### Option 1: Full Stack (Recommended)

Start both the Node.js server and Python backend:

```bash
# Terminal 1: Start the main application
npm run dev

# Terminal 2: Start the Python AI backend (optional for enhanced processing)
cd backend
python app.py
```

### Option 2: Node.js Only

The application includes a fallback system that works without the Python backend:

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Project Structure

```
ai-welding-defect-detection/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── ui/          # Reusable UI components
│   │   │   ├── upload-zone.tsx
│   │   │   ├── image-analysis.tsx
│   │   │   ├── results-panel.tsx
│   │   │   ├── processing-modal.tsx
│   │   │   └── advanced-settings.tsx
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility functions
│   │   └── main.tsx         # Entry point
│   └── index.html
├── server/                   # Node.js backend
│   ├── routes.ts            # API routes
│   ├── storage.ts           # Data storage
│   ├── index.ts             # Server entry point
│   └── vite.ts              # Vite configuration
├── backend/                  # Python AI backend
│   ├── app.py               # Flask application
│   ├── models/
│   │   └── yolo_detector.py # AI detection engine
│   ├── utils/
│   │   └── image_processor.py # Image processing utilities
│   └── requirements.txt     # Python dependencies
├── shared/
│   └── schema.ts            # Shared TypeScript types
├── package.json             # Node.js dependencies
└── README.md
```

## Usage

### 1. Upload X-Ray Image
- Drag and drop or click to select an X-ray image (JPEG/PNG, max 10MB)
- Supported formats: `.jpg`, `.jpeg`, `.png`
- Recommended: High-resolution radiographic images

### 2. Analysis Process
- The system automatically processes the image using AI algorithms
- Real-time progress updates during analysis
- Processing typically takes 2-5 seconds

### 3. View Results
- Visual overlay showing detected defects with colored bounding boxes
- Detailed results panel with:
  - Defect count and types
  - Confidence scores
  - Individual defect details
  - Processing statistics

### 4. Advanced Features
- **Advanced Settings**: Configure detection sensitivity and analysis modes
- **Export Reports**: Download detailed analysis reports
- **Multiple Analysis**: Process multiple images sequentially

## Defect Types Detected

The system can identify the following welding defects:

1. **Cracks** (Red overlay)
   - Linear discontinuities
   - Stress cracks
   - Heat-affected zone cracks

2. **Porosity** (Yellow overlay)
   - Gas pockets
   - Wormhole porosity
   - Clustered porosity

3. **Slag Inclusions** (Orange overlay)
   - Non-metallic inclusions
   - Trapped slag
   - Oxidation defects

## Configuration

### Advanced Settings

Access the Advanced Settings panel to configure:

- **Detection Sensitivity**: Adjust from 25% to 100%
- **Analysis Mode**: 
  - Fast Scan (30s)
  - Standard (60s) - Recommended
  - Thorough (120s)
  - Critical Inspection (180s)
- **Defect Type Toggles**: Enable/disable specific defect detection
- **Confidence Threshold**: Set minimum confidence for reporting defects

### API Endpoints

- `GET /api/test` - API health check
- `POST /api/analyze-fallback` - Image analysis (Node.js backend)
- `POST /api/analyze` - Image analysis (Python backend, if available)
- `GET /api/history` - Analysis history

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run type-check   # TypeScript type checking
```

### Adding New Features

1. **Frontend Components**: Add to `client/src/components/`
2. **API Routes**: Modify `server/routes.ts`
3. **AI Algorithms**: Extend `backend/models/yolo_detector.py`
4. **Types**: Update `shared/schema.ts`

## Troubleshooting

### Common Issues

**1. Port Already in Use**
```bash
# Kill process using port 5000
npx kill-port 5000
```

**2. Python Dependencies Missing**
```bash
cd backend
pip install --upgrade pip
pip install -r requirements.txt
```

**3. Node Modules Issues**
```bash
rm -rf node_modules package-lock.json
npm install
```

**4. TypeScript Errors**
```bash
npm run type-check
```

### Performance Optimization

- Use high-resolution images for better detection accuracy
- Enable only required defect types in Advanced Settings
- Use Standard analysis mode for balanced speed/accuracy
- Ensure stable internet connection for optimal performance

## System Requirements

### Minimum Requirements
- 4GB RAM
- 2 CPU cores
- 1GB available disk space
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Recommended Requirements
- 8GB RAM
- 4 CPU cores
- 2GB available disk space
- High-resolution display (1920x1080 or higher)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## API Documentation

### Image Analysis Endpoint

**POST** `/api/analyze-fallback`

**Request:**
- Content-Type: `multipart/form-data`
- Body: Form data with `file` field containing the image

**Response:**
```json
{
  "success": true,
  "message": "Analysis completed successfully",
  "image_info": {
    "filename": "weld_xray.jpg",
    "width": 1024,
    "height": 768,
    "format": "JPEG",
    "size_bytes": 2048000
  },
  "detections": [
    {
      "class": "crack",
      "confidence": 0.92,
      "bbox": {
        "x": 300,
        "y": 250,
        "width": 150,
        "height": 80
      },
      "center": {
        "x": 375,
        "y": 290
      }
    }
  ],
  "summary": {
    "total_defects": 1,
    "defect_types": {
      "crack": 1
    },
    "average_confidence": 0.92,
    "processing_time": 2.4
  }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, issues, or feature requests, please create an issue in the GitHub repository or contact the development team.

---

**Note**: This system is designed for demonstration and educational purposes. For production welding inspection, ensure proper calibration and validation with certified welding standards.
