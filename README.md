# AI Welding Defect Detection System

A full-stack AI-powered system for detecting and analyzing welding defects in images.  
Built with **React, Node.js, Python**, and advanced image processing algorithms.

## 🚀 Features
- **Real-time Defect Detection**: Detects cracks, porosity, and slag inclusions  
- **Advanced Image Processing**: Algorithms including edge detection, morphological operations, and blob detection  
- **Interactive Visualization**: Visual overlay of detected defects with bounding boxes and confidence scores  
- **Professional UI**: Modern, responsive interface with dark/light mode support  
- **Detailed Analysis Reports**: Exportable reports with recommendations and detailed findings  
- **Advanced Settings**: Configurable detection sensitivity, analysis modes, and confidence thresholds  
- **Dual Backend Architecture**: Python AI engine with Node.js fallback for reliability  

## 🛠️ Technology Stack
### Frontend
- React 18 with TypeScript  
- Tailwind CSS  
- Radix UI components (accessibility)  
- TanStack React Query (state management)  
- Wouter (client-side routing)  
- Vite (build tooling)  

### Backend
- Node.js/Express (API server)  
- Python Flask (AI processing)  
- Advanced image processing with custom algorithms  
- Multi-format support (JPEG, PNG)  

## 📦 Prerequisites
- Node.js (v18+)  
- npm (comes with Node.js)  
- Python (v3.11+)  
- Git  

## ⚙️ Installation
```bash
# Clone the repository
git clone <repository-url>
cd ai-welding-defect-detection

# Install frontend dependencies
npm install

# Install Python dependencies
cd backend
pip install -r requirements.txt
cd ..
```

## ▶️ Running the Application
### Option 1: Full Stack (Recommended)
```bash
# Terminal 1: Start the main application
npm run dev

# Terminal 2: Start the Python AI backend
cd backend
python app.py
```

### Option 2: Node.js Only
```bash
npm run dev
```
👉 The app will be available at: **http://localhost:5000**

## 📂 Project Structure
```
ai-welding-defect-detection/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       
│   │   │   ├── ui/          
│   │   │   ├── upload-zone.tsx
│   │   │   ├── image-analysis.tsx
│   │   │   ├── results-panel.tsx
│   │   │   ├── processing-modal.tsx
│   │   │   └── advanced-settings.tsx
│   │   ├── pages/           
│   │   ├── hooks/           
│   │   ├── lib/             
│   │   └── main.tsx         
│   └── index.html
├── server/                   # Node.js backend
│   ├── routes.ts            
│   ├── storage.ts           
│   ├── index.ts             
│   └── vite.ts              
├── backend/                  # Python AI backend
│   ├── app.py               
│   ├── models/
│   │   └── yolo_detector.py 
│   ├── utils/
│   │   └── image_processor.py 
│   └── requirements.txt     
├── shared/
│   └── schema.ts            
├── package.json             
└── README.md
```

## 📊 Usage
### 1. Upload Image
- Drag and drop or click to select an image (`.jpg`, `.jpeg`, `.png`, max 10MB)  
- High-resolution images recommended  

### 2. Analysis Process
- The AI automatically processes the image  
- Real-time progress updates  
- Typical processing time: **2–5s**  

### 3. View Results
- Defect overlay with bounding boxes  
- Results panel showing:  
  - Defect types & count  
  - Confidence scores  
  - Processing stats  

### 4. Advanced Features
- Configurable **detection sensitivity**  
- Multiple **analysis modes**  
- Export reports  
- Batch analysis  

## 🔎 Defect Types Detected
1. **Cracks** (Red overlay)  
   - Linear, stress, heat-affected zone cracks  
2. **Porosity** (Yellow overlay)  
   - Gas pockets, wormhole porosity, clustered porosity  
3. **Slag Inclusions** (Orange overlay)  
   - Non-metallic inclusions, trapped slag, oxidation defects  

## ⚙️ Configuration
- **Detection Sensitivity** (25–100%)  
- **Analysis Modes**: Fast, Standard, Thorough, Critical  
- **Defect Toggles**: Enable/disable specific defect types  
- **Confidence Threshold** customization  

## 📡 API Endpoints
- `GET /api/test` → Health check  
- `POST /api/analyze-fallback` → Node.js-based image analysis  
- `POST /api/analyze` → Python AI backend analysis  
- `GET /api/history` → Analysis history  

## 🛠️ Development
```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
npm run type-check # TypeScript type check
```

## 🐞 Troubleshooting
**1. Port already in use**  
```bash
npx kill-port 5000
```
**2. Python dependencies missing**  
```bash
cd backend
pip install --upgrade pip
pip install -r requirements.txt
```
**3. Node modules issue**  
```bash
rm -rf node_modules package-lock.json
npm install
```
**4. TypeScript errors**  
```bash
npm run type-check
```

## 💻 System Requirements
### Minimum
- 4GB RAM  
- 2 CPU cores  
- 1GB disk space  
- Modern browser  
### Recommended
- 8GB RAM  
- 4 CPU cores  
- 2GB disk space  
- 1080p+ display  

## 🌐 Browser Support
- Chrome 90+  
- Firefox 88+  
- Safari 14+  
- Edge 90+  

## 🤝 Contributing
1. Fork the repo  
2. Create feature branch: `git checkout -b feature-name`  
3. Make changes & test  
4. Commit: `git commit -m "Add feature"`  
5. Push: `git push origin feature-name`  
6. Open PR  

## 📜 License
Licensed under the **MIT License** – see [LICENSE](./LICENSE) file.  

## 📩 Support
For support, issues, or feature requests:  
- Open an issue in the repo  
- Or contact the dev team  

**Note**: This system is designed for demonstration and educational purposes. For production welding inspection, ensure calibration & validation with certified welding standards.
