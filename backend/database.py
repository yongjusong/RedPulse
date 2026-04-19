import sqlite3
import os
from datetime import datetime
from contextlib import contextmanager

DATABASE_FILE = "redpulse.db"

@contextmanager
def get_db():
    conn = sqlite3.connect(DATABASE_FILE)
    conn.row_factory = sqlite3.Row
    try:
        yield conn.cursor()
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def init_db():
    """
    Initialize the database schema.
    """
    with get_db() as cursor:
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

def save_telemetry(payload):
    """
    Save a single telemetry payload to the database.
    """
    with get_db() as cursor:
        cursor.execute('''
        INSERT INTO telemetry (
            node_name, drive_id, timestamp, waf, temperature_c, 
            pe_cycles_used, available_spare_percent, read_mbps, write_mbps, iops
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            payload.node_name, payload.drive_id, payload.timestamp, payload.waf, payload.temperature_c,
            payload.pe_cycles_used, payload.available_spare_percent, payload.read_mbps, payload.write_mbps, payload.iops
        ))

def get_latest_topology():
    """
    Get the latest state of all disks in all nodes.
    """
    with get_db() as cursor:
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
        
    # Organize into the {node: {drive: data}} structure
    topology = {}
    for row in rows:
        node = row['node_name']
        drive = row['drive_id']
        if node not in topology:
            topology[node] = {}
        topology[node][drive] = dict(row)
        
    return topology

def get_node_drives(node_name):
    """
    Get a list of distinct drive IDs mounted on a specific node.
    """
    with get_db() as cursor:
        cursor.execute('''
        SELECT DISTINCT drive_id FROM telemetry 
        WHERE node_name = ? AND drive_id IS NOT NULL
        ''', (node_name,))
        
        rows = cursor.fetchall()
        return [row['drive_id'] for row in rows]

def get_node_history(node_name, drive_id=None, limit=30):
    """
    Get the telemetry history for a specific node and an optional drive with a configurable limit.
    """
    with get_db() as cursor:
        if drive_id:
            cursor.execute('''
            SELECT * FROM telemetry 
            WHERE node_name = ? AND drive_id = ?
            ORDER BY timestamp DESC 
            LIMIT ?
            ''', (node_name, drive_id, limit))
        else:
            cursor.execute('''
            SELECT * FROM telemetry 
            WHERE node_name = ? 
            ORDER BY timestamp DESC 
            LIMIT ?
            ''', (node_name, limit))
        
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
