#!/bin/bash
set -e

echo "Starting build process..."
echo "Current directory: $(pwd)"
echo "Contents:"
ls -la

echo "Checking if frontend directory exists..."
if [ -d "frontend" ]; then
    echo "Frontend directory found!"
    
    # Copy package.json to root for Vercel to detect Next.js
    echo "Copying package.json to root for Vercel detection..."
    cp frontend/package.json ./package.json
    
    # Install dependencies in frontend
    echo "Installing dependencies in frontend..."
    cd frontend
    npm install
    
    # Build the application
    echo "Building application..."
    npm run build
    echo "Build completed successfully!"
else
    echo "ERROR: Frontend directory not found!"
    exit 1
fi
