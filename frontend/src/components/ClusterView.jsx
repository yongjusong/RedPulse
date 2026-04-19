import React, { useMemo, useState, useEffect } from 'react';
import AlertPanel from './AlertPanel';
import { API_URLS, fetchApi, getSeverityColor, getSeverityLabel } from '../api';
import useAppStore from '../store';

export default function ClusterView() {
  const jumpToPredictor = useAppStore(state => state.jumpToPredictor);
  const [stats, setStats] = useState({
    total_nodes: 0,
    total_disks: 0,
    critical_alerts: 0,
    warning_alerts: 0,
    overall_health: 100
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState(null); // null, 0, 1, 2
  const [selectedNode, setSelectedNode] = useState(null);
  const [liveTopology, setLiveTopology] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsData = await fetchApi(API_URLS.STATS);
        if (statsData.status === 'success') {
          setStats(statsData.data);
        }

        const topologyData = await fetchApi(API_URLS.TOPOLOGY);
        if (topologyData.status === 'success') {
          setLiveTopology(topologyData.data);
        }
      } catch (err) {
        console.error("Could not fetch cluster data", err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

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

  // Sort and Filter nodes
  const sortedNodes = useMemo(() => {
    const dataToUse = liveTopology.length > 0 ? liveTopology : mockClusterData;
    
    return [...dataToUse]
      .filter(node => {
        const matchesSearch = node.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSeverity = filterSeverity === null || node.maxSeverity === filterSeverity;
        return matchesSearch && matchesSeverity;
      })
      .sort((a, b) => b.maxSeverity - a.maxSeverity);
  }, [mockClusterData, liveTopology, searchTerm, filterSeverity]);

  return (
    <div className="eng-panel" style={{ height: '100%', overflowY: 'auto', padding: '1rem', borderTop: 'none', borderRight: 'none', borderBottom: 'none' }}>
       <AlertPanel nodes={liveTopology.length > 0 ? liveTopology : mockClusterData} />

       {/* Aggregate Stats Header */}
       <div className="stats-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-card" style={{ padding: '0.85rem', borderTop: '3px solid #111' }}>
            <div className="stat-label">Overall Health</div>
            <div className="stat-value" style={{ color: stats.overall_health < 80 ? '#dc2626' : '#111' }}>
              {(stats.overall_health || 100).toFixed(1)}%
            </div>
          </div>
          <div className="stat-card" style={{ padding: '0.85rem' }}>
            <div className="stat-label">Inventory</div>
            <div className="stat-value">
                <span title="Nodes">{stats.total_nodes || 24}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>N</span>
                <span style={{ margin: '0 8px', color: 'var(--border-color)', fontWeight: 'normal' }}>|</span>
                <span title="Disks">{stats.total_disks || 384}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>D</span>
            </div>
          </div>
          <div className="stat-card" style={{ padding: '0.85rem', borderTop: stats.critical_alerts > 0 ? '3px solid #dc2626' : '3px solid transparent' }}>
            <div className="stat-label">Critical Alerts</div>
            <div className="stat-value" style={{ color: stats.critical_alerts > 0 ? '#dc2626' : '#111' }}>
              {stats.critical_alerts || 0}
            </div>
          </div>
          <div className="stat-card" style={{ padding: '0.85rem', borderTop: stats.warning_alerts > 0 ? '3px solid #d97706' : '3px solid transparent' }}>
            <div className="stat-label">Warnings</div>
            <div className="stat-value" style={{ color: stats.warning_alerts > 0 ? '#d97706' : '#111' }}>
              {stats.warning_alerts || 0}
            </div>
          </div>
       </div>

       <h2 style={{ marginBottom: '1.5rem', color: '#18181b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
          Cluster Resource Topology
          <span style={{ fontSize: '0.9rem', fontWeight: 400, color: '#71717a' }}>
            (Live View: {stats.total_nodes ? `${stats.total_nodes} Active Nodes` : "Awaiting Agent Data..."})
          </span>
       </h2>
       
       {/* Filter Bar */}
       <div style={{ display: 'flex', gap: '15px', marginBottom: '1.5rem', alignItems: 'center', background: '#f8fafc', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '2px' }}>
          <input 
            type="text" 
            placeholder="Search Node ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #d1d5db', width: '250px', outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
                onClick={() => setFilterSeverity(null)}
                style={{ padding: '6px 12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #d1d5db', background: filterSeverity === null ? '#111' : 'white', color: filterSeverity === null ? 'white' : '#111', fontWeight: 'bold', fontSize: '0.8rem' }}>
                ALL
            </button>
            <button 
                onClick={() => setFilterSeverity(2)}
                style={{ padding: '6px 12px', cursor: 'pointer', borderRadius: '4px', border: 'none', background: filterSeverity === 2 ? '#dc2626' : '#fee2e2', color: filterSeverity === 2 ? 'white' : '#dc2626', fontWeight: 'bold', fontSize: '0.8rem' }}>
                CRITICAL
            </button>
            <button 
                onClick={() => setFilterSeverity(1)}
                style={{ padding: '6px 12px', cursor: 'pointer', borderRadius: '4px', border: 'none', background: filterSeverity === 1 ? '#d97706' : '#ffedd5', color: filterSeverity === 1 ? 'white' : '#d97706', fontWeight: 'bold', fontSize: '0.8rem' }}>
                WARNING
            </button>
            <button 
                onClick={() => setFilterSeverity(0)}
                style={{ padding: '6px 12px', cursor: 'pointer', borderRadius: '4px', border: 'none', background: filterSeverity === 0 ? '#16a34a' : '#dcfce7', color: filterSeverity === 0 ? 'white' : '#16a34a', fontWeight: 'bold', fontSize: '0.8rem' }}>
                HEALTHY
            </button>
          </div>
       </div>

       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1px', background: 'var(--border-color)', border: '1px solid var(--border-color)' }}>
          {sortedNodes.map(node => (
            <div 
              key={node.id} 
              onClick={() => jumpToPredictor(node.id)}
              style={{ 
                padding: '1rem', 
                background: node.maxSeverity === 2 ? '#fef2f2' : (node.maxSeverity === 1 ? '#fff7ed' : '#ffffff'),
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span className="mono-text" style={{ fontWeight: 600, fontSize: '0.9rem', color: '#18181b' }}>{node.id.toUpperCase()}</span>
                <span style={{ 
                  fontSize: '0.65rem', 
                  padding: '2px 6px', 
                  borderRadius: '2px', 
                  background: getSeverityColor(node.maxSeverity),
                  color: 'white',
                  fontWeight: '600'
                }}>
                  {getSeverityLabel(node.maxSeverity)}
                </span>
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: `repeat(${node.disks.length === 24 ? 8 : (node.disks.length === 16 ? 8 : 6)}, 1fr)`, 
                gap: '2px' 
              }}>
                {node.disks.map(disk => (
                  <div 
                    key={`${node.id}-slot-${disk.slot}`}
                    className="mono-text"
                    style={{
                      aspectRatio: '1/1',
                      background: getSeverityColor(disk.severity),
                      borderRadius: '1px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.6rem',
                      color: 'white',
                      fontWeight: '500',
                      cursor: 'help',
                      opacity: disk.severity === 0 ? 0.7 : 1
                    }}
                    title={`Slot ${disk.slot}\nHealth: ${disk.health}%\nWAF: ${disk.waf}\nTemp: ${disk.temp}°C`}
                  >
                    {disk.slot}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '0.8rem', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                <span>{node.disks.length}-Bay Topology</span>
                <span style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--accent-base)' }}>View Trace</span>
              </div>
            </div>
          ))}
       </div>
    </div>
  );
}
