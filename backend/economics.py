import math
from simulator.vendors import COMMERCIAL_DRIVES

# Constants for risk model
FAILURE_RISK_COST_USD = 1000.0  # Cost per failure event (downtime, labor)
GENERIC_GB_COST_USD = 0.08      # Fallback cost per GB if model not found

def get_drive_price(drive_id, capacity_gb):
    """
    Returns the estimated unit price of a drive.
    """
    model = next((d for d in COMMERCIAL_DRIVES if d["id"] == drive_id), None)
    if model:
        return model.get("unitPriceUSD", capacity_gb * GENERIC_GB_COST_USD)
    return capacity_gb * GENERIC_GB_COST_USD

def calculate_economics(topology):
    """
    Aggregates financial metrics for the entire cluster.
    """
    total_asset_value_initial = 0.0
    total_asset_value_current = 0.0
    replacement_budget_required = 0.0
    total_risk_cost = 0.0
    
    total_disks = 0
    warning_count = 0
    critical_count = 0

    for node_name, drives in topology.items():
        for drive_id, data in drives.items():
            total_disks += 1
            # Current health is 100 - (waf * 5) roughly in our mock, 
            # let's use the provided available_spare_percent as a proxy for health
            health = data.get('available_spare_percent', 100.0)
            waf = data.get('waf', 1.0)
            
            # Simple depreciation: value = initial_price * (health / 100)
            # Actually, let's use a non-linear depreciation for enterprise context
            # (Value drops faster as it nears failure)
            initial_price = get_drive_price(drive_id, 4000) # Fallback 4TB if not found
            current_value = initial_price * (health / 100.0)
            
            total_asset_value_initial += initial_price
            total_asset_value_current += current_value
            
            # Risk Cost: Probability of failure increases as health drops
            # Risk = FAILURE_RISK_COST * (1 - health/100)^2
            risk_factor = ((100.0 - health) / 100.0) ** 2
            total_risk_cost += FAILURE_RISK_COST_USD * risk_factor

            # Budget needed for Warning/Critical devices
            if waf > 5.0 or health < 15:
                replacement_budget_required += initial_price
                critical_count += 1
            elif waf > 3.0 or health < 35:
                # We might not replace warnings immediately, but we budget for them
                replacement_budget_required += (initial_price * 0.5) 
                warning_count += 1

    return {
        "summary": {
            "total_initial_investment": round(total_asset_value_initial, 2),
            "current_asset_value": round(total_asset_value_current, 2),
            "total_depreciation": round(total_asset_value_initial - total_asset_value_current, 2),
            "replacement_budget_next_6m": round(replacement_budget_required, 2),
            "estimated_risk_exposure": round(total_risk_cost, 2)
        },
        "counts": {
            "total_disks": total_disks,
            "critical": critical_count,
            "warning": warning_count
        }
    }

def calculate_optimal_replacement(predicted_rul_days: float, drive_id: str, capacity_gb: int = 4000) -> dict:
    """
    Calculates the optimal financial replacement day using TCO-Coupled AI logic.
    Intersection of Expected Risk Penalty and Residual Depreciated Value.
    """
    if predicted_rul_days <= 1:
        return {"optimal_replacement_days": 0, "financial_savings_usd": 0}
        
    initial_price = get_drive_price(drive_id, capacity_gb)
    
    optimal_day = int(predicted_rul_days)
    max_savings = 0.0
    
    # We iterate backwards from the predicted Failure Day to Day 0
    # to find the ideal day where keeping the drive becomes MORE costly than replacing it.
    for day in range(int(predicted_rul_days), -1, -1):
        # Health decreases linearly from 100 to 0 over the predicted RUL
        health_percent = max(0.01, 100 - (100 / predicted_rul_days) * day)
        
        residual_value = initial_price * (health_percent / 100.0)
        
        # Risk probability escalates exponentially at the end of life
        # At 0 health, risk is 1.0 (100% chance of failure). At 100 health, risk is 0.
        risk_probability = ((100.0 - health_percent) / 100.0) ** 4
        expected_risk_cost = FAILURE_RISK_COST_USD * risk_probability
        
        # We want to replace it the moment Expected Risk exceeds the Residual Value
        if expected_risk_cost >= residual_value:
            optimal_day = day
            max_savings = expected_risk_cost - residual_value
        else:
            # The moment residual value > risk cost, we found the tipping point (from going backwards)
            break
            
    # Guarantee some minimum buffer
    if optimal_day == int(predicted_rul_days):
        optimal_day = int(predicted_rul_days * 0.95)
        
    return {
        "optimal_replacement_days": max(0, optimal_day),
        "financial_savings_usd": int(max_savings) if max_savings > 0 else 0
    }
