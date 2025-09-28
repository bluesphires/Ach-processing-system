#!/bin/bash
set -e

echo "Starting Next.js application..."
echo "PORT: $PORT"
echo "NODE_ENV: $NODE_ENV"

# Build the application if .next doesn't exist
if [ ! -d ".next" ]; then
    echo "Building application..."
    npm run build
fi

# Start the application
echo "Starting application on port $PORT..."
npm start
