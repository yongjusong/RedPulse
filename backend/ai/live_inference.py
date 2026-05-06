import os
import torch
import torch.nn as nn
import joblib

# Light-weight Online Inference Module
# This module represents the "Asymmetric Compute Burden" principle.
# It contains NO physics simulation. It purely performs O(1) time complexity matches
# against pre-trained weights, creating near-zero latency for cluster-wide live monitoring.

class SSDLifeLSTM(nn.Module):
    def __init__(self, input_size=2, hidden_size=64, num_layers=2):
        super(SSDLifeLSTM, self).__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, 1)

    def forward(self, x):
        x = x.to('cpu')
        out, _ = self.lstm(x)
        last_hidden = out[:, -1, :]
        return self.fc(last_hidden)

MODEL_PATH = "ai/models/ssd_lstm_v1.pth"
_MODELS_CACHE = {}

def load_lstm_model():
    """
    Lazy load the LSTM inference model into memory.
    """
    global _MODELS_CACHE
    if "lstm" in _MODELS_CACHE:
        return _MODELS_CACHE["lstm"]
    
    model = SSDLifeLSTM()
    model.to('cpu')
    
    # Path resolution for when running from main.py or tests
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    full_path = os.path.join(base_dir, MODEL_PATH)
    
    if os.path.exists(full_path):
        try:
            model.load_state_dict(torch.load(full_path, map_location=torch.device('cpu'), weights_only=True))
            model.eval()
            _MODELS_CACHE["lstm"] = model
            print(f"[Live Inference Engine] Loaded pure inference layer from {full_path}")
            return model
        except Exception as e:
            print(f"Error loading LSTM model: {e}")
    
    return None

def load_rf_model():
    """
    Lazy load the Scikit-learn Random Forest model.
    """
    global _MODELS_CACHE
    if "rf" in _MODELS_CACHE:
        return _MODELS_CACHE["rf"]
        
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    full_path = os.path.join(base_dir, "ai/pretrained_rf_model.pkl")
    
    if os.path.exists(full_path):
        try:
            model = joblib.load(full_path)
            _MODELS_CACHE["rf"] = model
            print(f"[Live Inference Engine] Loaded pure inference layer from {full_path}")
            return model
        except Exception as e:
            print(f"Error loading RF model: {e}")
    
    return None

def predict_rul_with_lstm(sequence: list):
    """
    Takes a sequence of [waf, hit_ratio] and predicts RUL in days.
    """
    model = load_lstm_model()
    if not model:
        return 365 * 3 # 3 years dummy
    
    if len(sequence) < 30:
        last_val = sequence[-1] if sequence else [1.0, 0.0]
        while len(sequence) < 30:
            sequence.append(last_val)
    elif len(sequence) > 30:
        sequence = sequence[-30:]
        
    input_tensor = torch.tensor([sequence], dtype=torch.float32, device='cpu')
    
    with torch.no_grad():
        pred_years = model(input_tensor).item()
    
    return pred_years * 365.0

def predict_rul_telemetry(drive_type, capacity_gb, writes_gb, rand_ratio, cache_size_gb, waf, hit_ratio):
    """Legacy compatibility wrapper"""
    sequence = [[waf, hit_ratio]] * 30
    return predict_rul_with_lstm(sequence)

def predict_rul_ensemble(sequence: list, drive_type: str, capacity_gb: int, daily_writes_gb: int, random_ratio: float, cache_size_gb: int, waf_avg: float, hit_ratio_avg: float) -> float:
    """
    Ensemble Model: Combine LSTM Deep Learning (70%) with Scikit-learn Random Forest (30%).
    This establishes a robust forecasting system leveraging two distinct architectures.
    """
    dl_days = predict_rul_with_lstm(sequence)
    
    rf_model = load_rf_model()
    
    if rf_model:
        # Encode drive_type as expected by the model
        drive_type_encoded = 0 # TLC
        if drive_type == "QLC":
            drive_type_encoded = 1
        elif drive_type == "Hybrid":
            drive_type_encoded = 2
            
        features = [[
            drive_type_encoded, 
            capacity_gb, 
            daily_writes_gb, 
            random_ratio, 
            cache_size_gb, 
            waf_avg, 
            hit_ratio_avg
        ]]
        
        try:
            rf_days = rf_model.predict(features)[0]
        except Exception as e:
            print(f"Error during RF predict, falling back. {e}")
            rf_days = _deterministic_fallback(capacity_gb, daily_writes_gb, waf_avg)
    else:
        rf_days = _deterministic_fallback(capacity_gb, daily_writes_gb, waf_avg)
    
    # Blend outputs
    ensemble_days = (dl_days * 0.70) + (rf_days * 0.30)
    
    return int(ensemble_days)

def _deterministic_fallback(capacity_gb: int, daily_writes_gb: int, waf_avg: float) -> float:
    actual_daily_writes = daily_writes_gb * max(1.0, waf_avg)
    if actual_daily_writes <= 0:
        actual_daily_writes = 0.1
    deterministic_days = (capacity_gb * 3000) / actual_daily_writes
    return min(3650, deterministic_days)
