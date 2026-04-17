import uvicorn
import sys
import os

# Add the current directory to sys.path to allow importing backend module
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("🚀 Starting RedPulse Backend on PORT 8085 (Beta Evaluation Mode)")
    uvicorn.run("main:app", host="0.0.0.0", port=8085, reload=True)
