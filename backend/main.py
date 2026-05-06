from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from database import init_db, save_telemetry, get_latest_topology, get_node_history, get_node_drives
from economics import calculate_economics, calculate_optimal_replacement
from ai.model import predict_rul_telemetry, predict_rul_with_lstm, predict_rul_ensemble, load_lstm_model
import threading

app = FastAPI(title="RedPulse Simulator API")

# Setup CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    print("🔥 Warming up AI Models...")
    load_lstm_model()
    print("✅ Models ready for inference.")
    
    # Start the automated reporting cron job in a background thread
    from report_job import start_reporting_cron
    cron_thread = threading.Thread(target=start_reporting_cron, daemon=True)
    cron_thread.start()
    print("✅ Automated Reporting Daemon started.")

# Define frontend static directory
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

# Mount Static Files (Assets)
if os.path.exists(FRONTEND_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")), name="assets")


class SimulationRequest(BaseModel):
    driveType: str # "TLC", "QLC", "Hybrid"
    capacityGB: int
    readWriteRatio: int # e.g. 30 (for 30/70 r/w)
    dailyWritesGB: int
    randomSequentialRatio: int # e.g. 80 (for 80/20 random/seq)
    cacheSizeGB: Optional[int] = None # For Hybrid
    modelName: Optional[str] = None # Commercial drive ID
    customTBW: Optional[int] = 0 # In Terabytes
    cachePolicy: Optional[str] = "write-back" # Software OS cache policy

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

# Initialize database on module load
init_db()


@app.get("/api/v1/cluster/stats")
def get_cluster_stats():
    """
    Returns aggregated metrics for the entire cluster.
    """
    db_topology = get_latest_topology()
    total_nodes = len(db_topology)
    total_disks = 0
    critical_disks = 0
    warning_disks = 0
    
    for node, drives in db_topology.items():
        for drive_id, data in drives.items():
            total_disks += 1
            if data['waf'] > 5.0 or data['available_spare_percent'] < 10:
                critical_disks += 1
            elif data['waf'] > 3.0 or data['available_spare_percent'] < 30:
                warning_disks += 1
                
    return {
        "status": "success",
        "data": {
            "total_nodes": total_nodes,
            "total_disks": total_disks,
            "critical_alerts": critical_disks,
            "warning_alerts": warning_disks,
            "overall_health": 100 - (critical_disks * 10 + warning_disks * 2) / (total_disks or 1)
        }
    }


@app.get("/api/v1/economics/summary")
def get_economics_summary():
    """
    Returns the TCO and Risk Analysis for the entire cluster.
    """
    topology = get_latest_topology()
    econ_data = calculate_economics(topology)
    return {"status": "success", "data": econ_data}


@app.get("/api/v1/cluster/topology")
def get_cluster_topology():
    """
    Returns the organized node/disk status for the cluster view cards.
    """
    db_topology = get_latest_topology()
    topology = []
    
    for node_id, drives in db_topology.items():
        disks = []
        max_severity = 0
        
        sorted_drive_ids = sorted(drives.keys())
        for idx, drive_id in enumerate(sorted_drive_ids):
            data = drives[drive_id]
            severity = 0
            
            # Severity logic based on WAF and Available Spare
            if data['waf'] > 5.0 or data['available_spare_percent'] < 10:
                severity = 2
            elif data['waf'] > 3.0 or data['available_spare_percent'] < 30:
                severity = 1
                
            if severity > max_severity:
                max_severity = severity
                
            # Health calculation: weighted average of spare and waf impact
            # Assuming TBW of 1000TB for a standard drive for this summary
            spare_health = data['available_spare_percent']
            waf_health = max(0, 100 - (data['waf'] * 8)) 
            agg_health = min(spare_health, waf_health)

            disks.append({
                "slot": idx + 1,
                "drive_id": drive_id,
                "health": round(agg_health, 2),
                "severity": severity,
                "waf": data['waf'],
                "temp": data['temperature_c'],
                "spare": data['available_spare_percent']
            })
            
        topology.append({
            "id": node_id,
            "disks": disks,
            "maxSeverity": max_severity,
            "uptime_days": 124, # Mock uptime for UI
            "location": "Rack-A-01" # Mock location
        })
        
    return {"status": "success", "data": topology}

def standard_response(data, status="success"):
    return {"status": status, "data": data}

@app.get("/api/v1/cluster/node/{node_name}/history")
def get_node_telemetry_history(node_name: str, drive: str = None):
    """
    Returns the historical telemetry for a specific node and an optional drive.
    """
    history = get_node_history(node_name, drive_id=drive)
    return {"status": "success", "data": history}

@app.get("/api/v1/cluster/node/{node_name}/drives")
def get_node_drives_endpoint(node_name: str):
    """
    Returns distinct drive IDs mounted on a specific node.
    """
    drives = get_node_drives(node_name)
    return {"status": "success", "data": drives}



@app.post("/api/v1/telemetry/ingest")
def ingest_telemetry(payload: AgentPayload):
    save_telemetry(payload)
    return {"status": "success", "recorded_waf": payload.waf}

@app.get("/api/v1/models")
def get_commercial_models():
    from simulator.vendors import COMMERCIAL_DRIVES
    return {"status": "success", "data": COMMERCIAL_DRIVES}

class NewModelRequest(BaseModel):
    vendor: str
    modelName: str
    type: str
    capacityGB: int
    tbw: int

@app.post("/api/v1/models")
def add_commercial_model(req: NewModelRequest):
    from simulator.vendors import COMMERCIAL_DRIVES
    
    new_id = f"{req.vendor.lower().replace(' ', '_')}_{req.modelName.lower().replace(' ', '_')}_{req.capacityGB}gb"
    
    new_model = {
        "id": new_id,
        "vendor": req.vendor,
        "modelName": req.modelName,
        "type": req.type,
        "capacityGB": req.capacityGB,
        "tbw": req.tbw,
        "dwpd": round(req.tbw * 1000 / (req.capacityGB * 365 * 5), 2), # Approx DWPD calculation
        "unitPriceUSD": 0,
        "description": "User Custom Defined Model"
    }
    COMMERCIAL_DRIVES.append(new_model)
    return {"status": "success", "data": new_model}

@app.put("/api/v1/models/{model_id}")
def update_commercial_model(model_id: str, req: NewModelRequest):
    from simulator.vendors import COMMERCIAL_DRIVES
    for entry in COMMERCIAL_DRIVES:
        if entry["id"] == model_id:
            entry["vendor"] = req.vendor
            entry["modelName"] = req.modelName
            entry["type"] = req.type
            entry["capacityGB"] = req.capacityGB
            entry["tbw"] = req.tbw
            entry["dwpd"] = round(req.tbw * 1000 / (req.capacityGB * 365 * 5), 2)
            return {"status": "success", "data": entry}
    return {"status": "error", "message": "Model not found"}

@app.delete("/api/v1/models/{model_id}")
def delete_commercial_model(model_id: str):
    from simulator.vendors import COMMERCIAL_DRIVES
    target = None
    for idx, entry in enumerate(COMMERCIAL_DRIVES):
        if entry["id"] == model_id:
            target = idx
            break
    if target is not None:
        COMMERCIAL_DRIVES.pop(target)
        return {"status": "success"}
    return {"status": "error", "message": "Model not found"}

class FederatedGradientPayload(BaseModel):
    agent_id: str
    gradient_vector: List[float]
    loss_diff: float
    secure_token: str

@app.post("/api/v1/telemetry/federated_gradient")
def ingest_federated_gradient(payload: FederatedGradientPayload):
    """
    Accepts microweights (gradients) from on-prem agents for Meta-Tuning.
    Does NOT accept raw PII or secure data, only the differential tensors.
    """
    print(f"📦 Received federated gradient from {payload.agent_id}. Loss diff: {payload.loss_diff}")
    # Mock save to local directory for the Meta-Tuning engine to process later
    return {"status": "success", "message": "Gradients logged for Meta-Tuning aggregation."}

@app.post("/simulate")
def run_simulation(req: SimulationRequest):
    from simulator.engine import run_simulation_engine
    random_ratio = req.randomSequentialRatio / 100.0
    result = run_simulation_engine(
        drive_type=req.driveType,
        capacity_gb=req.capacityGB,
        daily_writes_gb=req.dailyWritesGB,
        random_ratio=random_ratio,
        cache_size_gb=req.cacheSizeGB or 0,
        model_name=req.modelName,
        custom_tbw=req.customTBW or 0,
        cache_policy=req.cachePolicy
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
    predicted_rul = predict_rul_telemetry(
        drive_type=req.driveType,
        capacity_gb=req.capacityGB,
        writes_gb=req.dailyWritesGB,
        rand_ratio=req.randomSequentialRatio / 100.0,
        cache_size_gb=req.cacheSizeGB or 0,
        waf=req.observed_waf,
        hit_ratio=req.observed_hit_ratio
    )
    
    # Generate an extrapolated time series for the UI
    time_series = []
    years = max(0.1, predicted_rul / 365)
    points = 10
    days_step = predicted_rul / points
    
    for i in range(points + 1):
        day = int(i * days_step)
        health = max(0, 100 - (100 / (predicted_rul or 1)) * day)
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

@app.get("/api/v1/cluster/node/{node_name}/predict")
def predict_node_life_with_lstm(node_name: str, lookback: int = 30, drive: str = None):
    """
    Predicts the life of a node using LSTM.
    'lookback' defines how many recent telemetry samples to consider.
    'drive' filters telemetry to a specific SSD drive.
    """
    history = get_node_history(node_name, drive_id=drive, limit=lookback)
    if not history:
        return {"status": "error", "message": "No history found for node/drive"}
    
    subject_disk = drive if drive else history[0]['drive_id']
    sequence = []
    
    disk_history = [h for h in history if h['drive_id'] == subject_disk]
    disk_history.sort(key=lambda x: x['timestamp'])
    
    for entry in disk_history:
        sequence.append([entry['waf'], 0.5]) # hit_ratio mock
        
    # Ensemble AI call instead of purely LSTM to prevent overfitting logic
    avg_waf = sum([x[0] for x in sequence]) / len(sequence)
    avg_hit = sum([x[1] for x in sequence]) / len(sequence)
    
    # Mock data for missing telemetry variables (in a real system these would be in node profile)
    mock_drive_type = "TLC"
    mock_capacity = 4000
    mock_daily_writes = 100
    mock_random_ratio = 0.8
    mock_cache_size = 0
    
    predicted_rul = predict_rul_ensemble(
        sequence, 
        drive_type=mock_drive_type, 
        capacity_gb=mock_capacity, 
        daily_writes_gb=mock_daily_writes, 
        random_ratio=mock_random_ratio, 
        cache_size_gb=mock_cache_size, 
        waf_avg=avg_waf,
        hit_ratio_avg=avg_hit
    )
    
    # Calculate Confidence Interval (Uncertainty)
    # The fewer samples we have, the higher the uncertainty (between 5% and 30%)
    uncertainty_factor = min(0.30, max(0.05, 1.0 / max(1, len(sequence))))
    lower_bound_days = max(0, predicted_rul * (1.0 - uncertainty_factor))
    upper_bound_days = predicted_rul * (1.0 + uncertainty_factor)
    
    # Generate an extrapolated time series for the UI
    time_series = []
    points = 10
    days_step = predicted_rul / points
    for i in range(points + 1):
        day = int(i * days_step)
        health = max(0, 100 - (100 / (predicted_rul or 1)) * day)
        time_series.append({"day": day, "health_percent": round(health, 2)})

    # Calculate Optimal Replacement (TCO FinOps)
    finops_data = calculate_optimal_replacement(predicted_rul, subject_disk, 4000)

    return {
        "status": "success",
        "predicted_rul_days": int(predicted_rul),
        "confidence_lower_days": int(lower_bound_days),
        "confidence_upper_days": int(upper_bound_days),
        "optimal_replacement_days": finops_data["optimal_replacement_days"],
        "financial_savings_usd": finops_data["financial_savings_usd"],
        "node_name": node_name,
        "drive_id": subject_disk,
        "time_series_data": time_series
    }

@app.get("/")
def read_root():
    index_file = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "Welcome to RedPulse Simulation Engine"}

@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    if full_path.startswith("api/"):
        return {"error": "Not Found"}
    index_file = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"error": "Frontend assets not found"}
