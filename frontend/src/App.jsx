import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

function App() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [config, setConfig] = useState({
    driveType: 'QLC',
    capacityGB: 4000,
    dailyWritesGB: 2000, // 0.5 DWPD
    randomSequentialRatio: 80, // 80% random
    cacheSizeGB: 100
  });

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error(err);
      alert("Backend is not running. Please start FastAPI.");
    }
    setLoading(false);
  };

  return (
    <div className="dashboard-container">
      <header className="header">
        <div className="logo">RED<span>PULSE</span></div>
        <div style={{color: 'var(--text-secondary)'}}>AI-Based SSD Lifespan Simulator</div>
      </header>

      {/* Sidebar Configuration */}
      <aside className="glass-panel config-section">
        <h2>Device & Workload</h2>
        
        <div className="form-group">
          <label>Drive Topology</label>
          <select 
            className="form-control"
            value={config.driveType}
            onChange={(e) => setConfig({...config, driveType: e.target.value})}
          >
            <option value="TLC">Pure TLC (High Endurance)</option>
            <option value="QLC">Pure QLC (High Capacity)</option>
            <option value="Hybrid">Device-Mapper Hybrid (SLC+QLC)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Backend Capacity (GB)</label>
          <input type="number" className="form-control" value={config.capacityGB} 
            onChange={e => setConfig({...config, capacityGB: parseInt(e.target.value)})} />
        </div>

        {config.driveType === 'Hybrid' && (
          <div className="form-group">
            <label>SLC Cache Tier Size (GB)</label>
            <input type="number" className="form-control" value={config.cacheSizeGB} 
              onChange={e => setConfig({...config, cacheSizeGB: parseInt(e.target.value)})} />
          </div>
        )}

        <div className="form-group">
          <label>Daily Writes (GB/day)</label>
          <input type="number" className="form-control" value={config.dailyWritesGB} 
            onChange={e => setConfig({...config, dailyWritesGB: parseInt(e.target.value)})} />
        </div>

        <div className="form-group">
          <label>Random I/O Ratio (%) : {config.randomSequentialRatio}%</label>
          <input type="range" min="0" max="100" className="form-control" 
            value={config.randomSequentialRatio} 
            onChange={e => setConfig({...config, randomSequentialRatio: parseInt(e.target.value)})} />
        </div>

        <button className="btn-run" onClick={handleSimulate} disabled={loading}>
          {loading ? 'Simulating...' : 'Run Prediction 🚀'}
        </button>
      </aside>

      {/* Main Dashboard Area */}
      <main>
        {results ? (
          <>
            <div className="stats-grid">
              <div className="glass-panel stat-card">
                <div className="stat-label">Predicted Lifespan</div>
                <div className="stat-value" style={{color: results.predicted_rul_days > 1000 ? '#39ff14' : '#ff3366'}}>
                  {(results.predicted_rul_days / 365).toFixed(1)} <span style={{fontSize: '1rem'}}>Years</span>
                </div>
              </div>
              <div className="glass-panel stat-card">
                <div className="stat-label">Average WAF</div>
                <div className="stat-value">{results.metrics.average_waf}x</div>
              </div>
              <div className={`glass-panel stat-card ${config.driveType === 'Hybrid' ? 'hybrid' : ''}`}>
                <div className="stat-label">Cache Hit Ratio</div>
                <div className="stat-value">{(results.metrics.cache_hit_ratio * 100).toFixed(1)}%</div>
              </div>
            </div>

            <div className="glass-panel">
              <h2>Degradation Curve (RUL)</h2>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={results.time_series_data} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="day" 
                      stroke="#94a3b8" 
                      tickFormatter={(val) => `Year ${(val/365).toFixed(1)}`} 
                    />
                    <YAxis stroke="#94a3b8" domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(22, 30, 46, 0.9)', border: '1px solid #00f0ff' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="health_percent" 
                      name="SSD Health %" 
                      stroke={config.driveType === 'Hybrid' ? '#39ff14' : '#00f0ff'} 
                      strokeWidth={3} 
                      dot={false}
                    />
                    <ReferenceLine y={0} stroke="#ff3366" strokeDasharray="3 3" label="End of Life" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : (
          <div className="glass-panel" style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8'}}>
            <h2>Configure parameters and run simulation to view insights.</h2>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
