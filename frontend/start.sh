#!/bin/bash

# Template Editor Frontend - Quick Start Script

echo "🚀 Starting Template Editor Frontend..."
echo ""

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Please run this script from the frontend directory."
  exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
  echo ""
fi

# Start the development server
echo "✅ Starting Next.js development server..."
echo "📍 Open http://localhost:3000 in your browser"
echo "📝 Template Editor: http://localhost:3000/editor"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
