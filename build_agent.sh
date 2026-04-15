#!/bin/bash
# RedPulse Agent Binary Build Script

echo "--- Starting RedPulse Agent Build Process ---"

# 1. Activate environment
source backend/venv/bin/activate

# 2. Run PyInstaller
# --onefile: bundle everything into a single executable
# --name: set the output filename
# --clean: clean cache before build
# Using explicit paths to avoid permission issues in system folders
echo "Compiling redpulse-cli.py into standalone binary..."
mkdir -p build_temp dist_temp
pyinstaller --onefile \
            --name redpulse-agent \
            --clean \
            --workpath ./build_temp \
            --distpath ./dist_temp \
            --specpath ./ \
            redpulse-cli.py

echo "--- Build Complete ---"
echo "Binary location: $(pwd)/dist_temp/redpulse-agent"
ls -lh dist_temp/redpulse-agent
