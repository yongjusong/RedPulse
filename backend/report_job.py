import os
import time
from database import get_latest_topology
from economics import calculate_economics
from datetime import datetime

REPORTS_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "reports")

def generate_html_report():
    os.makedirs(REPORTS_DIR, exist_ok=True)
    
    topology = get_latest_topology()
    econ_data = calculate_economics(topology)
    
    summary = econ_data.get("summary", {})
    counts = econ_data.get("counts", {})
    
    html_content = f"""
    <html>
    <head>
        <title>RedPulse Executive Report</title>
        <style>
            body {{ font-family: 'Inter', sans-serif; padding: 40px; color: #111; background: #fff; }}
            h1 {{ color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px; }}
            .card {{ border: 1px solid #e4e4e7; padding: 20px; border-radius: 8px; margin-bottom: 20px; background: #fafafa; flex: 1; }}
            .metric {{ font-size: 1.5rem; font-weight: bold; color: #111; }}
            .label {{ font-size: 0.9rem; color: #71717a; text-transform: uppercase; }}
            .row {{ display: flex; gap: 20px; width: 100%; }}
            .danger {{ color: #dc2626; }}
            .success {{ color: #10b981; }}
        </style>
    </head>
    <body>
        <h1>RedPulse TCO Executive Summary</h1>
        <p>Generated at: <strong>{datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</strong></p>
        
        <h2>Infrastructure Overview</h2>
        <div class="row">
            <div class="card">
                <div class="label">Total Disks</div>
                <div class="metric">{counts.get('total_disks', 0)}</div>
            </div>
            <div class="card">
                <div class="label danger">Critical Alerts</div>
                <div class="metric danger">{counts.get('critical', 0)}</div>
            </div>
            <div class="card">
                <div class="label">Warning Alerts</div>
                <div class="metric">{counts.get('warning', 0)}</div>
            </div>
        </div>
        
        <h2>Financial Impact & TCO (USD)</h2>
        <div class="row">
            <div class="card">
                <div class="label">Initial Total Investment</div>
                <div class="metric">${summary.get('total_initial_investment', 0):,}</div>
            </div>
            <div class="card">
                <div class="label">Current Aggregated Asset Value</div>
                <div class="metric">${summary.get('current_asset_value', 0):,}</div>
            </div>
        </div>
        <div class="row">
            <div class="card" style="border-left: 4px solid #f59e0b;">
                <div class="label">Replacement Budget Required (Next 6M)</div>
                <div class="metric">${summary.get('replacement_budget_next_6m', 0):,}</div>
            </div>
            <div class="card" style="border-left: 4px solid #dc2626;">
                <div class="label">Projected Downtime Risk Penalty</div>
                <div class="metric danger">${summary.get('estimated_risk_exposure', 0):,}</div>
            </div>
        </div>
        
        <p style="margin-top: 40px; color: #71717a; font-size: 0.85rem;">
            * <i>Note: The Projected Downtime Risk Penalty denotes the unrecoverable latency overhead expected from deteriorating devices. Proactive cluster maintenance via the FINOPS AI module recommendations will mitigate this unrecoverable cost efficiently.</i>
        </p>
    </body>
    </html>
    """
    
    file_path = os.path.join(REPORTS_DIR, "latest_executive_report.html")
    with open(file_path, "w") as f:
        f.write(html_content)
    print(f"📄 [Cron] Generated Automated Executive Report: {file_path}")

def start_reporting_cron():
    """
    Runs continuously in a separate daemon thread.
    Generates report every 60 seconds to support live Beta Environment Testing.
    """
    # Initial sleep to allow DB and HTTP server to spin up
    time.sleep(5)
    while True:
        try:
            generate_html_report()
        except Exception as e:
            print(f"Error generating automated report: {e}")
        # Run every 60 seconds for demo pacing
        time.sleep(60)
