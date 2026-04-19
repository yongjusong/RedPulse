import os
import time
import json
import random
import requests
import argparse
import subprocess
import socket
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

# Configuration
DEFAULT_API_URL = "http://localhost:8085/api/v1/telemetry/ingest"
INTERVAL_SECONDS = 10  # MVP interval for testing

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

class OSMetricCollector:
    def __init__(self, use_mock=True, drive_id="nvme0n1"):
        self.use_mock = use_mock
        self.drive_id = drive_id
        # For mock state progression
        self.mock_waf = 2.1
        self.mock_pe = 100
        self.mock_spare = 100

    def get_metrics(self):
        if self.use_mock:
            return self._get_mock_metrics()
        else:
            return self._get_real_metrics()

    def _get_mock_metrics(self):
        # Add some random noise to simulate dynamic workload
        self.mock_waf += random.uniform(-0.1, 0.15)
        self.mock_waf = max(1.0, round(self.mock_waf, 2))
        
        self.mock_pe += random.randint(0, 2)
        
        # spare drops very rarely, but just for mock:
        if random.random() > 0.95:
            self.mock_spare = max(0, self.mock_spare - 1)
            
        # 호스트 OS의 실제 머신 이름(Hostname)을 동적으로 가져옵니다.
        current_hostname = socket.gethostname()
            
        return AgentPayload(
            node_name=current_hostname,
            drive_id=self.drive_id,
            timestamp=datetime.utcnow().isoformat() + "Z",
            waf=self.mock_waf,
            temperature_c=random.randint(35, 50),
            pe_cycles_used=self.mock_pe,
            available_spare_percent=self.mock_spare,
            read_mbps=round(random.uniform(50.0, 500.0), 2),
            write_mbps=round(random.uniform(10.0, 200.0), 2),
            iops=random.randint(1000, 50000)
        )

    def _get_real_metrics(self):
        """
        Parses real nvme-cli / smartctl output.
        Not implemented fully in this prototype (requires actual linux environment and root privileges).
        """
        # Example subprocess call logic for future implementation:
        # result = subprocess.run(["sudo", "smartctl", "-A", f"/dev/{self.drive_id}"], capture_output=True, text=True)
        # return parsed payload...
        pass

class Transmitter:
    def __init__(self, url):
        self.url = url
    
    def send(self, payload: AgentPayload):
        try:
            headers = {"Content-Type": "application/json"}
            response = requests.post(self.url, json=payload.model_dump(), headers=headers, timeout=5)
            response.raise_for_status()
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Success: Sent {payload.drive_id} stats (WAF: {payload.waf}) to {self.url}")
        except Exception as e:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Failed to send data: {e}")

def run_agent():
    parser = argparse.ArgumentParser(description="RedPulse Telemetry Agent")
    parser.add_argument("--url", type=str, default=DEFAULT_API_URL, help="Backend ingest API URL")
    parser.add_argument("--drive", type=str, default="nvme0n1", help="Target drive ID")
    parser.add_argument("--real", action="store_true", help="Use real linux metrics instead of mock")
    args = parser.parse_args()

    collector = OSMetricCollector(use_mock=not args.real, drive_id=args.drive)
    transmitter = Transmitter(args.url)

    print(f"🚀 Starting RedPulse Telemetry Agent on target {args.drive}...")
    print(f"🔌 Dest API: {args.url}")
    print(f"🛠️ Mode: {'Real OS Logs' if args.real else 'Mock Simulator'}")
    
    try:
        while True:
            metrics = collector.get_metrics()
            transmitter.send(metrics)
            time.sleep(INTERVAL_SECONDS)
    except KeyboardInterrupt:
        print("\nStopping agent.")

if __name__ == "__main__":
    run_agent()
