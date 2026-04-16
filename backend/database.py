import sqlite3
import os
from datetime import datetime

DATABASE_FILE = "redpulse.db"

def get_db_connection():
    conn = sqlite3.connect(DATABASE_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """
    Initialize the database schema.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Tables for persistent inventory and metrics
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS telemetry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        node_name TEXT,
        drive_id TEXT,
        timestamp DATETIME,
        waf REAL,
        temperature_c INTEGER,
        pe_cycles_used INTEGER,
        available_spare_percent INTEGER,
        read_mbps REAL,
        write_mbps REAL,
        iops INTEGER
    )
    ''')
    
    # Indexing for faster retrieval
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_telemetry_node ON telemetry(node_name)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_telemetry_drive ON telemetry(drive_id)')
    
    conn.commit()
    conn.close()

def save_telemetry(payload):
    """
    Save a single telemetry payload to the database.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
    INSERT INTO telemetry (
        node_name, drive_id, timestamp, waf, temperature_c, 
        pe_cycles_used, available_spare_percent, read_mbps, write_mbps, iops
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        payload.node_name, payload.drive_id, payload.timestamp, payload.waf, payload.temperature_c,
        payload.pe_cycles_used, payload.available_spare_percent, payload.read_mbps, payload.write_mbps, payload.iops
    ))
    
    conn.commit()
    conn.close()

def get_latest_topology():
    """
    Get the latest state of all disks in all nodes.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Subquery to get the latest record for each node/drive pair
    cursor.execute('''
    SELECT t.* FROM telemetry t
    INNER JOIN (
        SELECT node_name, drive_id, MAX(timestamp) as max_ts
        FROM telemetry
        GROUP BY node_name, drive_id
    ) latest ON t.node_name = latest.node_name 
             AND t.drive_id = latest.drive_id 
             AND t.timestamp = latest.max_ts
    ''')
    
    rows = cursor.fetchall()
    conn.close()
    
    # Organize into the {node: {drive: data}} structure we used in memory
    topology = {}
    for row in rows:
        node = row['node_name']
        drive = row['drive_id']
        if node not in topology:
            topology[node] = {}
        topology[node][drive] = dict(row)
        
    return topology

def get_node_history(node_name, limit=50):
    """
    Get the telemetry history for a specific node.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
    SELECT * FROM telemetry 
    WHERE node_name = ? 
    ORDER BY timestamp DESC 
    LIMIT ?
    ''', (node_name, limit))
    
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]
