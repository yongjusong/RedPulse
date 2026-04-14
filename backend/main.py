from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

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
    modelName: Optional[str] = None # Commercial drive ID

class AgentPayload(BaseModel):
    node_name: str
    drive_id: str
    timestamp: str
    waf: float
    temperature_c: int
    pe_cycles_used: int
    available_spare_percent: int
    read_mbps: float
    write_mbps: float
    iops: int

# In-memory storage for MVP. In production, use DB (e.g., TimescaleDB)
telemetry_db: List[AgentPayload] = []

@app.get("/")
def read_root():
    return {"message": "Welcome to RedPulse Simulation Engine"}

@app.post("/api/v1/telemetry/ingest")
def ingest_telemetry(payload: AgentPayload):
    """
    Endpoint for receiving real-time telemetry from on-premise agents.
    """
    telemetry_db.append(payload)
    print(f"Received telemetry from {payload.node_name}:{payload.drive_id} -> WAF {payload.waf}")
    return {"status": "success", "recorded_waf": payload.waf, "db_size": len(telemetry_db)}

@app.get("/api/v1/models")
def get_commercial_models():
    """
    Returns a list of supported commercial SSD models.
    """
    from simulator.vendors import COMMERCIAL_DRIVES
    return {"status": "success", "data": COMMERCIAL_DRIVES}

@app.post("/simulate")
def run_simulation(req: SimulationRequest):
    """
    Mode 1: Virtual Simulation Engine
    """
    from simulator.engine import run_simulation_engine
    
    random_ratio = req.randomSequentialRatio / 100.0
    
    result = run_simulation_engine(
        drive_type=req.driveType,
        capacity_gb=req.capacityGB,
        daily_writes_gb=req.dailyWritesGB,
        random_ratio=random_ratio,
        cache_size_gb=req.cacheSizeGB or 0,
        model_name=req.modelName
    )
    
    return result

class TelemetryRequest(BaseModel):
    driveType: str
    capacityGB: int
    readWriteRatio: int
    dailyWritesGB: int
    randomSequentialRatio: int
    cacheSizeGB: Optional[int] = None
    observed_waf: float
    observed_hit_ratio: float

@app.post("/extrapolate")
def run_extrapolation(req: TelemetryRequest):
    """
    Mode 2: ML-based Telemetry Extrapolation
    """
    from ai.model import predict_rul_telemetry
    
    random_ratio = req.randomSequentialRatio / 100.0
    predicted_rul = predict_rul_telemetry(
        drive_type=req.driveType,
        capacity_gb=req.capacityGB,
        writes_gb=req.dailyWritesGB,
        rand_ratio=random_ratio,
        cache_size_gb=req.cacheSizeGB or 0,
        waf=req.observed_waf,
        hit_ratio=req.observed_hit_ratio
    )
    
    # Generate an extrapolated time series for the UI
    time_series = []
    # Simple linear degradation based on ML prediction for the UI visualization
    years = predicted_rul / 365
    points = 10
    days_step = predicted_rul / points
    
    for i in range(points + 1):
        day = int(i * days_step)
        health = max(0, 100 - (100 / predicted_rul) * day)
        time_series.append({"day": day, "health_percent": round(health, 2)})
        
    return {
        "status": "success",
        "predicted_rul_days": int(predicted_rul),
        "metrics": {
            "average_waf": req.observed_waf,
            "cache_hit_ratio": req.observed_hit_ratio
        },
        "time_series_data": time_series
    }
