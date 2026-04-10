from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="RedPulse Simulator API")

# Setup CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SimulationRequest(BaseModel):
    driveType: str # "TLC", "QLC", "Hybrid"
    capacityGB: int
    readWriteRatio: int # e.g. 30 (for 30/70 r/w)
    dailyWritesGB: int
    randomSequentialRatio: int # e.g. 80 (for 80/20 random/seq)
    cacheSizeGB: Optional[int] = None # For Hybrid

@app.get("/")
def read_root():
    return {"message": "Welcome to RedPulse Simulation Engine"}

@app.post("/simulate")
def run_simulation(req: SimulationRequest):
    from simulator.engine import run_simulation_engine
    
    random_ratio = req.randomSequentialRatio / 100.0
    
    result = run_simulation_engine(
        drive_type=req.driveType,
        capacity_gb=req.capacityGB,
        daily_writes_gb=req.dailyWritesGB,
        random_ratio=random_ratio,
        cache_size_gb=req.cacheSizeGB or 0
    )
    
    return result
