#!/bin/bash
# RedPulse Unified Server Build Script (Bare-metal)

echo "--- Starting RedPulse Unified Server Build ---"

# 1. Build Frontend
echo "Building React Frontend..."
cd frontend
npm install && npm run build
cd ..

# 2. Prepare Backend & Bundle
source backend/venv/bin/activate

# We need to tell PyInstaller to include the 'frontend/dist' folder
# Format: --add-data "source_path:dest_path"
# On Mac/Linux, the separator is ':'
echo "Bundling Backend + Frontend into single binary..."
mkdir -p build_server_temp dist_server_temp

pyinstaller --onefile \
            --name redpulse-server \
            --clean \
            --workpath ./build_server_temp \
            --distpath ./dist_server_temp \
            --add-data "frontend/dist:frontend/dist" \
            --add-data "backend/ai:backend/ai" \
            --add-data "backend/simulator:backend/simulator" \
            backend/main.py

echo "--- Unified Build Complete ---"
echo "Master Binary: $(pwd)/dist_server_temp/redpulse-server"
ls -lh dist_server_temp/redpulse-server
