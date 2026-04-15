import React, { useMemo, useState, useEffect } from 'react';

export default function ClusterView() {
  const [stats, setStats] = useState({
    total_nodes: 0,
    total_disks: 0,
    critical_alerts: 0,
    warning_alerts: 0,
    overall_health: 100
  });

  useEffect(() => {
    const fetchStats = () => {
      fetch('http://localhost:8000/api/v1/cluster/stats')
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                setStats(data.data);
            }
        })
        .catch(err => console.error("Could not fetch cluster stats", err));

      fetch('http://localhost:8000/api/v1/cluster/topology')
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                setLiveTopology(data.data);
            }
        })
        .catch(err => console.error("Could not fetch cluster topology", err));
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const [liveTopology, setLiveTopology] = useState([]);

  // Generate 24 mock nodes, each with multiple disks (Fallback for visualization demo)
  const mockClusterData = useMemo(() => {
    const nodes = [];
    for (let i = 1; i <= 24; i++) {
       const diskCount = [12, 16, 24][Math.floor(Math.random() * 3)]; // Standard server bays
       const disks = [];
       let maxSeverity = 0; // 0: green, 1: orange, 2: red
       
       for (let j = 1; j <= diskCount; j++) {
          let health = 100;
          const rand = Math.random();
          let severity = 0;
          
          if (rand < 0.05) {
            health = Math.floor(Math.random() * 30);
            severity = 2;
          } else if (rand < 0.15) {
            health = Math.floor(Math.random() * 50) + 30;
            severity = 1;
          } else {
            health = Math.floor(Math.random() * 20) + 80;
            severity = 0;
          }
          
          if (severity > maxSeverity) maxSeverity = severity;
          
          disks.push({
            slot: j,
            health: health,
            severity,
            waf: (1.1 + Math.random() * 2).toFixed(2),
            temp: Math.floor(Math.random() * 20) + 35
          });
       }
       
       nodes.push({
         id: `node-${i.toString().padStart(3, '0')}`,
         disks: disks,
         maxSeverity: maxSeverity
       });
    }
    return nodes;
  }, []);

  // Sort nodes: Heaviest severity first
  const sortedNodes = useMemo(() => {
    const dataToUse = liveTopology.length > 0 ? liveTopology : mockClusterData;
    return [...dataToUse].sort((a, b) => b.maxSeverity - a.maxSeverity);
  }, [mockClusterData, liveTopology]);

  const getSeverityColor = (severity) => {
    if (severity === 2) return '#dc2626'; // Critical Red
    if (severity === 1) return '#d97706'; // Warning Orange
    return '#16a34a'; // Healthy Green
  };

  return (
    <div className="glass-panel" style={{ height: '100%', overflowY: 'auto', padding: '1.5rem' }}>
       {/* Aggregate Stats Header */}
       <div className="stats-grid" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="glass-panel stat-card" style={{ padding: '1rem', borderTop: '4px solid #111' }}>
            <div className="stat-label">Overall Health</div>
            <div className="stat-value" style={{ fontSize: '1.8rem', color: stats.overall_health < 80 ? '#dc2626' : '#111' }}>
              {stats.overall_health.toFixed(1)}%
            </div>
          </div>
          <div className="glass-panel stat-card" style={{ padding: '1rem' }}>
            <div className="stat-label">Inventory</div>
            <div className="stat-value" style={{ fontSize: '1.8rem' }}>
                <span title="Nodes">{stats.total_nodes || 24}</span>
                <span style={{ fontSize: '1rem', color: '#71717a', marginLeft: '8px' }}>N</span>
                <span style={{ margin: '0 8px', color: '#e4e4e7' }}>|</span>
                <span title="Disks">{stats.total_disks || 384}</span>
                <span style={{ fontSize: '1rem', color: '#71717a', marginLeft: '4px' }}>D</span>
            </div>
          </div>
          <div className="glass-panel stat-card" style={{ padding: '1rem', borderTop: stats.critical_alerts > 0 ? '4px solid #dc2626' : '1px solid #e4e4e7' }}>
            <div className="stat-label">Critical Alerts</div>
            <div className="stat-value" style={{ fontSize: '1.8rem', color: stats.critical_alerts > 0 ? '#dc2626' : '#111' }}>
              {stats.critical_alerts}
            </div>
          </div>
          <div className="glass-panel stat-card" style={{ padding: '1rem', borderTop: stats.warning_alerts > 0 ? '4px solid #d97706' : '1px solid #e4e4e7' }}>
            <div className="stat-label">Warnings</div>
            <div className="stat-value" style={{ fontSize: '1.8rem', color: stats.warning_alerts > 0 ? '#d97706' : '#111' }}>
              {stats.warning_alerts}
            </div>
          </div>
       </div>

       <h2 style={{ marginBottom: '1.5rem', color: '#18181b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
          Cluster Resource Topology
          <span style={{ fontSize: '0.9rem', fontWeight: 400, color: '#71717a' }}>
            (Live View: {stats.total_nodes ? `${stats.total_nodes} Active Nodes` : "Awaiting Agent Data..."})
          </span>
       </h2>
       
       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {sortedNodes.map(node => (
            <div key={node.id} className="glass-panel" style={{ 
              padding: '1.2rem', 
              border: node.maxSeverity === 2 ? '1px solid #fca5a5' : '1px solid #e4e4e7',
              background: node.maxSeverity === 2 ? '#fef2f2' : 'white',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#18181b' }}>{node.id.toUpperCase()}</span>
                <span style={{ 
                  fontSize: '0.75rem', 
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  background: node.maxSeverity === 2 ? '#dc2626' : (node.maxSeverity === 1 ? '#d97706' : '#16a34a'),
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  {node.maxSeverity === 2 ? 'CRITICAL' : (node.maxSeverity === 1 ? 'WARNING' : 'HEALTHY')}
                </span>
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: `repeat(${node.disks.length === 24 ? 8 : (node.disks.length === 16 ? 8 : 6)}, 1fr)`, 
                gap: '6px' 
              }}>
                {node.disks.map(disk => (
                  <div 
                    key={`${node.id}-slot-${disk.slot}`}
                    style={{
                      aspectRatio: '1/1',
                      background: getSeverityColor(disk.severity),
                      borderRadius: '3px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.65rem',
                      color: 'white',
                      fontWeight: 'bold',
                      cursor: 'help',
                      opacity: disk.severity === 0 ? 0.8 : 1
                    }}
                    title={`Slot ${disk.slot}\nHealth: ${disk.health}%\nWAF: ${disk.waf}\nTemp: ${disk.temp}°C`}
                  >
                    {disk.slot}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#71717a', display: 'flex', justifyContent: 'space-between' }}>
                <span>{node.disks.length} Bays Array</span>
                <span style={{ cursor: 'pointer', textDecoration: 'underline' }}>Node Detail →</span>
              </div>
            </div>
          ))}
       </div>
    </div>
  );
}
