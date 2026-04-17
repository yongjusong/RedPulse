from .storage_models import TLC_Drive, QLC_Drive, Hybrid_Drive, Commercial_Drive
from .vendors import COMMERCIAL_DRIVES

def run_simulation_engine(
    drive_type: str,
    capacity_gb: int,
    daily_writes_gb: int,
    random_ratio: float,
    cache_size_gb: int = 0,
    model_name: str = None,
    custom_tbw: int = 0,
    collect_daily_until: int = 0,
    cache_policy: str = "write-back"
):
    """
    Simulates the wear over time until the drive fails (Health hits 0).
    Returns a time series describing the lifespan decay.
    """
    if model_name:
        # Lookup the commercial drive spec
        model_spec = next((d for d in COMMERCIAL_DRIVES if d["id"] == model_name), None)
        if not model_spec:
            raise ValueError(f"Commercial model not found: {model_name}")
        drive = Commercial_Drive(capacity_gb=model_spec["capacityGB"], tbw=model_spec["tbw"], drive_type=model_spec["type"])
        # Override these for accurate logging
        drive_type = model_spec["type"]
    elif custom_tbw > 0:
        # User defined spec (assume TLC as default for custom unless specified)
        drive = Commercial_Drive(capacity_gb=capacity_gb, tbw=custom_tbw, drive_type=drive_type)
    else:
        if drive_type == "TLC":
            drive = TLC_Drive(capacity_gb)
        elif drive_type == "QLC":
            drive = QLC_Drive(capacity_gb)
        elif drive_type == "Hybrid":
            drive = Hybrid_Drive(cache_size_gb, capacity_gb)
        else:
            raise ValueError(f"Unknown drive type: {drive_type}")

    time_series = []
    day = 0
    total_waf_sum = 0
    total_hit_ratio_sum = 0
    
    # We'll simulate day by day until health is 0 or 10 years max
    MAX_DAYS = 365 * 15 
    
    # Pre-calculate write portions
    random_writes = daily_writes_gb * random_ratio
    sequential_writes = daily_writes_gb * (1.0 - random_ratio)

    daily_log = []
    # Pre-calculate daily metrics (constant for the simulation duration)
    daily_waf = 0.0
    daily_hit = 0.0
    
    if drive_type == "Hybrid":
        waf1, hit = drive.apply_write(random_writes, is_random=True, cache_policy=cache_policy)
        waf2, _ = drive.apply_write(sequential_writes, is_random=False, cache_policy=cache_policy)
        daily_waf = (waf1 + waf2) / 2
        daily_hit = hit
        # In hybrid, we still need to loop day-by-day as the two drives decay differently
    else:
        w1 = drive.apply_write(random_writes, is_random=True)
        w2 = drive.apply_write(sequential_writes, is_random=False)
        daily_waf = (w1 * random_writes + w2 * sequential_writes) / (daily_writes_gb + 0.0001)

    while drive.health_percent > 0 and day < MAX_DAYS:
        # For non-hybrid drives, we can apply the pre-calculated WAF directly
        if drive_type != "Hybrid":
            # Just push the health update directly if no daily logs needed
            drive.apply_write(daily_writes_gb, is_random=(random_ratio > 0.5)) 
            # (Note: storage_models.py apply_write handles the health internally)
        else:
            # Hybrid still needs daily calculation
            drive.apply_write(random_writes, is_random=True, cache_policy=cache_policy)
            drive.apply_write(sequential_writes, is_random=False, cache_policy=cache_policy)

        total_waf_sum += daily_waf
        total_hit_ratio_sum += daily_hit

        # AI training collection: first N days
        if day < collect_daily_until:
            daily_log.append({
                "waf": daily_waf,
                "hit_ratio": daily_hit
            })

        # Record data periodically to save bandwidth
        if day % 30 == 0 or drive.health_percent <= 0:
            time_series.append({
                "day": day,
                "health_percent": round(drive.health_percent, 2)
            })

        day += 1

    avg_waf = total_waf_sum / day if day > 0 else 0
    avg_hit = total_hit_ratio_sum / day if day > 0 else 0

    return {
        "status": "success",
        "predicted_rul_days": day,
        "metrics": {
            "average_waf": round(avg_waf, 2),
            "cache_hit_ratio": round(avg_hit, 2) if drive_type == "Hybrid" else 0.0
        },
        "time_series_data": time_series,
        "daily_log": daily_log
    }

