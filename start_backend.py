#!/usr/bin/env python3
"""
Script to start the welding defect detection backend server.
"""
import subprocess
import sys
import os

def main():
    # Change to backend directory
    backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
    os.chdir(backend_dir)
    
    # Start the Flask server
    subprocess.run([sys.executable, 'app.py'])

if __name__ == '__main__':
    main()