# Quick Installation Guide

## For Windows Users

### 1. Install Prerequisites
1. Download and install **Node.js** from https://nodejs.org/ (choose LTS version)
2. Download and install **Python 3.11** from https://python.org/downloads/
3. Download and install **Git** from https://git-scm.com/downloads

### 2. Clone and Setup
Open Command Prompt or PowerShell and run:

```cmd
# Clone the repository (replace with actual repository URL)
git clone <repository-url>
cd ai-welding-defect-detection

# Install Node.js dependencies
npm install

# Install Python dependencies
cd backend
pip install -r requirements.txt
cd ..
```

### 3. Run the Application
```cmd
# Start the main application
npm run dev
```

Open your browser and go to `http://localhost:5000`

## For macOS Users

### 1. Install Prerequisites
1. Install **Homebrew** (if not already installed):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. Install Node.js and Python:
   ```bash
   brew install node python@3.11 git
   ```

### 2. Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd ai-welding-defect-detection

# Install dependencies
npm install
cd backend
pip3 install -r requirements.txt
cd ..
```

### 3. Run the Application
```bash
npm run dev
```

## For Linux (Ubuntu/Debian) Users

### 1. Install Prerequisites
```bash
# Update package manager
sudo apt update

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python and pip
sudo apt install python3.11 python3-pip git

# Install npm (if not included with Node.js)
sudo apt install npm
```

### 2. Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd ai-welding-defect-detection

# Install dependencies
npm install
cd backend
pip3 install -r requirements.txt
cd ..
```

### 3. Run the Application
```bash
npm run dev
```

## Troubleshooting

### Common Issues

**1. "npm: command not found"**
- Restart your terminal after installing Node.js
- On Windows: Add Node.js to your PATH environment variable

**2. "pip: command not found"**
- Use `pip3` instead of `pip` on macOS/Linux
- On Windows: Ensure Python is added to PATH during installation

**3. "Port 5000 already in use"**
- Close any applications using port 5000
- Or change the port in package.json

**4. Permission errors (Linux/macOS)**
- Use `sudo` for global installations
- Or configure npm to use a different directory

### Getting Help

If you encounter any issues:
1. Check the main README.md for detailed documentation
2. Ensure all prerequisites are properly installed
3. Try running commands with elevated privileges (sudo/admin)
4. Restart your terminal after installing new software

## Next Steps

After successful installation:
1. Open `http://localhost:5000` in your browser
2. Upload an X-ray image to test the system
3. Explore the Advanced Settings for customization
4. Export analysis reports for your records

## System Requirements Reminder

- **RAM**: Minimum 4GB, Recommended 8GB
- **Storage**: 2GB available space
- **Browser**: Modern browser (Chrome, Firefox, Safari, Edge)
- **Internet**: Required for initial setup and some features