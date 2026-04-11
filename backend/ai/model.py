import os
import random
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
import joblib
from simulator.engine import run_simulation_engine

MODEL_PATH = "ai/pretrained_rf_model.pkl"

def generate_synthetic_dataset(num_samples=1000):
    """
    Generates a synthetic dataset by running the physical simulation engine
    with various randomized parameters.
    """
    data = []
    drive_types = ["TLC", "QLC", "Hybrid"]
    
    print(f"Generating synthetic dataset with {num_samples} samples...")
    for i in range(num_samples):
        dtype = random.choice(drive_types)
        cap = random.choice([1000, 2000, 4000, 8000])
        writes = random.uniform(500, cap * 2) # 0.5 to 2.0 DWPD roughly
        rand_ratio = random.uniform(0.1, 1.0)
        cache_size = random.choice([50, 100, 200]) if dtype == "Hybrid" else 0
        
        # Run virtual engine to see what the actual WAF and RUL turns out to be
        result = run_simulation_engine(
            drive_type=dtype,
            capacity_gb=cap,
            daily_writes_gb=writes,
            random_ratio=rand_ratio,
            cache_size_gb=cache_size
        )
        
        # Simulated early telemetry (e.g., measurements taken at day 30)
        # We assume WAF and Cache Hit Ratio stabilize early
        early_waf = result["metrics"]["average_waf"]
        early_hit_ratio = result["metrics"]["cache_hit_ratio"]
        total_rul_days = result["predicted_rul_days"]
        
        # We want to predict RUL based on early telemetry
        data.append({
            "drive_type_encoded": drive_types.index(dtype),
            "capacity_gb": cap,
            "daily_writes_gb": writes,
            "random_ratio": rand_ratio,
            "cache_size_gb": cache_size,
            "observed_early_waf": early_waf,
            "observed_early_hit_ratio": early_hit_ratio,
            "target_rul_days": total_rul_days
        })
        
    df = pd.DataFrame(data)
    return df

def get_or_train_model():
    """
    Loads the model if it exists, otherwise generates data, trains, and saves it.
    """
    if os.path.exists(MODEL_PATH):
        try:
            model = joblib.load(MODEL_PATH)
            return model
        except Exception as e:
            print(f"Failed to load model: {e}. Retraining...")
            
    # Train a new one
    df = generate_synthetic_dataset(1000)
    
    X = df.drop(columns=["target_rul_days"])
    y = df["target_rul_days"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    score = model.score(X_test, y_test)
    print(f"Model trained successfully. Test R^2 Score: {score:.2f}")
    
    # Save the model
    os.makedirs("ai", exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    
    return model

def predict_rul_telemetry(drive_type, capacity_gb, writes_gb, rand_ratio, cache_size_gb, waf, hit_ratio):
    """
    Mode 2: Telemetry Extrapolation Mode.
    Takes the real observed WAF and Hit Ratio, feeds it to the AI, and predicts RUL.
    """
    model = get_or_train_model()
    
    # Encode inputs identically to training data
    dtype_map = {"TLC": 0, "QLC": 1, "Hybrid": 2}
    
    input_df = pd.DataFrame([{
        "drive_type_encoded": dtype_map.get(drive_type, 1),
        "capacity_gb": capacity_gb,
        "daily_writes_gb": writes_gb,
        "random_ratio": rand_ratio,
        "cache_size_gb": cache_size_gb,
        "observed_early_waf": waf,
        "observed_early_hit_ratio": hit_ratio
    }])
    
    predicted_rul = model.predict(input_df)[0]
    return predicted_rul
