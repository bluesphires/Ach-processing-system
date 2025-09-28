#!/bin/bash
set -e

echo "Starting build process..."
echo "Current directory: $(pwd)"
echo "Contents:"
ls -la

echo "Checking if frontend directory exists..."
if [ -d "frontend" ]; then
    echo "Frontend directory found!"
    cd frontend
    echo "Installing dependencies..."
    npm install
    echo "Building application..."
    npm run build
    echo "Build completed successfully!"
else
    echo "ERROR: Frontend directory not found!"
    exit 1
fi
