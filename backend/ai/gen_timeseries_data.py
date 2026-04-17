import os
import random
import numpy as np
import torch
from simulator.engine import run_simulation_engine

def generate_lstm_dataset(num_samples=2000, sequence_length=30):
    """
    Generates time-series telemetry data for training the LSTM model.
    Input: metrics for first 30 days. Target: total RUL in days.
    """
    print(f"Generating {num_samples} samples of length {sequence_length}...")
    
    X = []
    y = []
    
    drive_types = ["TLC", "QLC", "Hybrid"]
    
    for i in range(num_samples):
        dtype = random.choice(drive_types)
        cap = random.choice([1000, 2000, 4000, 8000])
        writes = random.uniform(500, cap * 1.5)
        rand_ratio = random.uniform(0.1, 1.0)
        cache_size = random.choice([50, 100, 200]) if dtype == "Hybrid" else 0
        
        # Run physics engine
        result = run_simulation_engine(
            drive_type=dtype,
            capacity_gb=cap,
            daily_writes_gb=writes,
            random_ratio=rand_ratio,
            cache_size_gb=cache_size,
            collect_daily_until=sequence_length
        )
        
        # Log check
        daily_log = result["daily_log"]
        if len(daily_log) < sequence_length:
            # Pad with last value if drive failed very early
            last_val = daily_log[-1] if daily_log else {"waf": 1.0, "hit_ratio": 0.0}
            while len(daily_log) < sequence_length:
                daily_log.append(last_val)
        
        # Features: [WAF, HitRatio]
        seq = [[d["waf"], d["hit_ratio"]] for d in daily_log]
        X.append(seq)
        
        # Normalize target (e.g., divided by 3650 for 10-year range)
        y.append([result["predicted_rul_days"] / 365.0])
        
        if (i+1) % 500 == 0:
            print(f"Progress: {i+1}/{num_samples}")

    X_tensor = torch.tensor(X, dtype=torch.float32)
    y_tensor = torch.tensor(y, dtype=torch.float32)
    
    os.makedirs("ai/data", exist_ok=True)
    torch.save({"X": X_tensor, "y": y_tensor}, "ai/data/lstm_dataset.pt")
    print(f"Dataset saved to ai/data/lstm_dataset.pt (Shape: {X_tensor.shape})")

if __name__ == "__main__":
    generate_lstm_dataset(1500, 30)
