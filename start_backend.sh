#!/bin/bash

echo "==============================================="
echo "    AthleteTracker Pro - Backend Server"
echo "==============================================="
echo

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo
echo "Starting Flask backend server..."
echo "Backend will be available at: http://localhost:5000"
echo
echo "To stop the server, press Ctrl+C"
echo

python3 run_backend.py
