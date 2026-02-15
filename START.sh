#!/bin/bash

echo "========================================"
echo " AI Character Generator - Local Server"
echo "========================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    echo "This may take a few minutes on first run."
    echo ""
    npm install
    if [ $? -ne 0 ]; then
        echo ""
        echo "ERROR: Failed to install dependencies!"
        echo "Make sure Node.js is installed: https://nodejs.org"
        echo ""
        read -p "Press Enter to exit..."
        exit 1
    fi
    echo ""
    echo "Dependencies installed successfully!"
    echo ""
fi

echo "Starting local development server..."
echo ""
echo "The app will open at: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop the server"
echo "========================================"
echo ""

# Start the dev server
npm run dev

# If the server stops, pause so user can see any errors
if [ $? -ne 0 ]; then
    echo ""
    echo "Server stopped with an error."
    read -p "Press Enter to exit..."
fi
