import React, { useMemo, useState, useEffect } from 'react';
import AlertPanel from './AlertPanel';
import NodeDetailDrawer from './NodeDetailDrawer';
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

  // Generate 48 mock nodes for a more "dense" honeycomb feel if live is empty
  const mockClusterData = useMemo(() => {
    const nodes = [];
    for (let i = 1; i <= 48; i++) {
       const diskCount = [12, 16, 24][Math.floor(Math.random() * 3)];
       const disks = [];
       let maxSeverity = 0;
       
       for (let j = 1; j <= diskCount; j++) {
          let health = 100;
          const rand = Math.random();
          let severity = 0;
          
          if (rand < 0.05) { health = Math.floor(Math.random() * 30); severity = 2; }
          else if (rand < 0.15) { health = Math.floor(Math.random() * 50) + 30; severity = 1; }
          else { health = Math.floor(Math.random() * 20) + 80; severity = 0; }
          
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
    <div className="eng-panel" style={{ height: '100%', overflowY: 'auto', padding: '0', border: 'none', background: '#fcfcfc' }}>
       <div style={{ padding: '1.5rem 2rem' }}>
          <AlertPanel nodes={liveTopology.length > 0 ? liveTopology : mockClusterData} />

          {/* Premium Stats Header */}
          <div className="stats-grid" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(4, 1fr)', borderRadius: '8px', overflow: 'hidden', border: 'none', background: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div className="stat-card" style={{ padding: '1.5rem', borderRight: '1px solid #f1f5f9' }}>
                <div className="stat-label">System Health</div>
                <div className="stat-value" style={{ color: stats.overall_health < 80 ? '#dc2626' : '#111', fontSize: '2rem' }}>
                  {(stats.overall_health || 100).toFixed(1)}%
                </div>
              </div>
              <div className="stat-card" style={{ padding: '1.5rem', borderRight: '1px solid #f1f5f9' }}>
                <div className="stat-label">Active Fleet</div>
                <div className="stat-value" style={{ fontSize: '2rem' }}>
                    {stats.total_nodes || liveTopology.length || 48}
                    <span style={{ fontSize: '0.9rem', color: '#94a3b8', marginLeft: '8px' }}>Nodes</span>
                </div>
              </div>
              <div className="stat-card" style={{ padding: '1.5rem', borderRight: '1px solid #f1f5f9' }}>
                <div className="stat-label">Critical Risks</div>
                <div className="stat-value" style={{ color: stats.critical_alerts > 0 ? '#dc2626' : '#111', fontSize: '2rem' }}>
                  {stats.critical_alerts || 0}
                </div>
              </div>
              <div className="stat-card" style={{ padding: '1.5rem' }}>
                <div className="stat-label">Warnings</div>
                <div className="stat-value" style={{ color: stats.warning_alerts > 0 ? '#d97706' : '#111', fontSize: '2rem' }}>
                  {stats.warning_alerts || 0}
                </div>
              </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Cluster Topology</h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>Real-time health distribution of storage nodes</p>
            </div>
            
            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  placeholder="Filter by Node ID..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '220px', outline: 'none', fontSize: '0.85rem' }}
                />
                <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                  {[
                    { val: null, label: 'ALL' },
                    { val: 2, label: 'CRITICAL', color: '#dc2626' },
                    { val: 1, label: 'WARNING', color: '#d97706' },
                    { val: 0, label: 'HEALTHY', color: '#16a34a' }
                  ].map(f => (
                    <button 
                      key={String(f.val)}
                      onClick={() => setFilterSeverity(f.val)}
                      style={{ 
                        padding: '6px 12px', 
                        cursor: 'pointer', 
                        borderRadius: '6px', 
                        border: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: filterSeverity === f.val ? 'white' : 'transparent',
                        color: filterSeverity === f.val ? (f.color || '#111') : '#64748b',
                        boxShadow: filterSeverity === f.val ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.2s'
                      }}>
                      {f.label}
                    </button>
                  ))}
                </div>
            </div>
          </div>

          {/* Honeycomb Grid Container */}
          <div className="honeycomb-grid">
            {sortedNodes.map(node => (
              <div 
                key={node.id} 
                className="hexagon-wrapper"
                onClick={() => setSelectedNode(node)}
              >
                <div className="hexagon" style={{ background: node.maxSeverity === 2 ? '#dc2626' : (node.maxSeverity === 1 ? '#d97706' : '#e2e8f0') }}>
                  <div className="hexagon-inner">
                    <span className="mono-text" style={{ fontSize: '0.7rem', fontWeight: 800, color: '#1e293b' }}>
                      {node.id.split('-')[1]}
                    </span>
                    <div style={{ 
                      marginTop: '8px', 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(4, 1fr)', 
                      gap: '2px',
                      width: '40px'
                    }}>
                       {node.disks.slice(0, 8).map((d, i) => (
                         <div key={i} style={{ width: '6px', height: '6px', background: getSeverityColor(d.severity), borderRadius: '1px' }} />
                       ))}
                    </div>
                    <span style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: '8px', fontWeight: 600 }}>
                      {node.disks.length} Bays
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
       </div>

       {/* Detail Drawer */}
       <NodeDetailDrawer 
          node={selectedNode} 
          onClose={() => setSelectedNode(null)} 
          onJumpToPredictor={(id) => {
            setSelectedNode(null);
            jumpToPredictor(id);
          }}
       />
    </div>
  );
}
