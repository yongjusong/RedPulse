#!/usr/bin/env python3
"""
RedPulse Linux Native CLI
Headless 환경에서 REST API를 통해 RedPulse의 PreFlight 모드를 즉시 돌려볼 수 있는 간편 래퍼 앱입니다.
"""

import argparse
import requests
import sys

API_URL = "http://localhost:8000"

def cmd_models():
    print("Fetching supported commercial SSD database from RedPulse...")
    try:
        r = requests.get(f"{API_URL}/api/v1/models")
        r.raise_for_status()
        data = r.json().get("data", [])
        print("\n[ Supported SSD Models ]")
        for m in data:
            print(f"- {m['id']:<25} | {m['vendor']} {m['modelName']} ({m['type']}, {m['capacityGB']}GB, {m['tbw']} TBW)")
        print("\nTip: Use the ID with --model when running 'simulate'.")
    except Exception as e:
        print(f"[Error] FastAPI backend is unreachable: {e}")

def cmd_simulate(args):
    payload = {
        "modelName": args.model if args.model else None,
        "driveType": args.type,
        "capacityGB": args.capacity,
        "dailyWritesGB": args.writes,
        "randomSequentialRatio": args.random_ratio,
        "cacheSizeGB": args.cache
    }
    print(f"Deploying PreFlight logic to {API_URL}/simulate ...")
    try:
        r = requests.post(f"{API_URL}/simulate", json=payload)
        r.raise_for_status()
        res = r.json()
        
        print("\n" + "="*40)
        print("         RedPulse PreFlight Report")
        print("="*40)
        p_days = res.get('predicted_rul_days', 0)
        p_years = p_days / 365.0
        metrics = res.get('metrics', {})
        
        print(f"Predicted RUL (Lifespan) : {p_days} days ({p_years:.1f} years)")
        print(f"Average WAF Generated    : {metrics.get('average_waf')}x")
        print("="*40)
    except Exception as e:
        print(f"[Error] Simulation failed. Backend may be offline: {e}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="RedPulse Linux CLI Wrapper")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # ls-models
    subparsers.add_parser("ls-models", help="List commercial SSD models available")
    
    # simulate
    sym_parser = subparsers.add_parser("simulate", help="Run a PreFlight scenario")
    sym_parser.add_argument("--model", type=str, default="", help="Commercial model ID (e.g. samsung_pm9a3_3_84tb)")
    sym_parser.add_argument("--type", type=str, default="TLC", help="Fallback type if no model is given (TLC, QLC, Hybrid)")
    sym_parser.add_argument("--capacity", type=int, default=4000, help="Backend Capacity in GB (Default: 4000)")
    sym_parser.add_argument("--writes", type=int, default=100, help="Daily Writes in GB (Default: 100)")
    sym_parser.add_argument("--random-ratio", type=int, default=80, help="Random IO Request Ratio % (Default: 80)")
    sym_parser.add_argument("--cache", type=int, default=0, help="SLC Cache Size in GB (for Hybrid) (Default: 0)")

    args = parser.parse_args()
    if args.command == "ls-models":
        cmd_models()
    elif args.command == "simulate":
        cmd_simulate(args)
    else:
        parser.print_help()
