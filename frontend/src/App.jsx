import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

function App() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [mode, setMode] = useState('Virtual'); // 'Virtual' or 'Telemetry'
  
  const [config, setConfig] = useState({
    driveType: 'QLC',
    capacityGB: 4000,
    dailyWritesGB: 2000, // 0.5 DWPD
    randomSequentialRatio: 80, // 80% random
    cacheSizeGB: 100,
    observed_waf: 2.1, // Only for Telemetry Mode
    observed_hit_ratio: 0.45 // Only for Telemetry Mode
  });

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const endpoint = mode === 'Virtual' ? '/simulate' : '/extrapolate';
      const bodyPayload = mode === 'Virtual' 
        ? {
            driveType: config.driveType,
            capacityGB: config.capacityGB,
            readWriteRatio: 30, // Dummy
            dailyWritesGB: config.dailyWritesGB,
            randomSequentialRatio: config.randomSequentialRatio,
            cacheSizeGB: config.cacheSizeGB
          }
        : {
            driveType: config.driveType,
            capacityGB: config.capacityGB,
            readWriteRatio: 30, // Dummy
            dailyWritesGB: config.dailyWritesGB,
            randomSequentialRatio: config.randomSequentialRatio,
            cacheSizeGB: config.cacheSizeGB,
            observed_waf: config.observed_waf,
            observed_hit_ratio: config.observed_hit_ratio
          };

      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
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
        <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
          <button 
            style={{flex: 1, padding: '0.5rem', background: mode === 'Virtual' ? 'var(--accent-blue)' : 'rgba(0,0,0,0.3)', color: mode === 'Virtual' ? 'black' : 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}
            onClick={() => setMode('Virtual')}
          >
            Virtual Mode
          </button>
          <button 
            style={{flex: 1, padding: '0.5rem', background: mode === 'Telemetry' ? 'var(--accent-green)' : 'rgba(0,0,0,0.3)', color: mode === 'Telemetry' ? 'black' : 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}
            onClick={() => setMode('Telemetry')}
          >
            Telemetry Mode
          </button>
        </div>
      
        <h2>{mode === 'Virtual' ? 'Virtual Topology' : 'Telemetry Input'}</h2>
        
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

        {mode === 'Telemetry' && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{fontSize: '0.9rem', color: 'var(--accent-green)', marginBottom: '1rem'}}>Observed Fio Data (1hr test)</h3>
            <div className="form-group">
              <label>Actual Write Amplification (WAF)</label>
              <input type="number" step="0.1" className="form-control" value={config.observed_waf} 
                onChange={e => setConfig({...config, observed_waf: parseFloat(e.target.value)})} />
            </div>
            {config.driveType === 'Hybrid' && (
              <div className="form-group">
                <label>Actual Cache Hit Ratio (0 to 1)</label>
                <input type="number" step="0.05" className="form-control" value={config.observed_hit_ratio} 
                  onChange={e => setConfig({...config, observed_hit_ratio: parseFloat(e.target.value)})} />
              </div>
            )}
          </div>
        )}

        <button className="btn-run" onClick={handleSimulate} disabled={loading} style={{ background: mode === 'Telemetry' ? 'linear-gradient(135deg, #39ff14 0%, #20b2aa 100%)' : '' }}>
          {loading ? 'Simulating...' : (mode === 'Virtual' ? 'Run Virtual Engine' : 'Run ML Extrapolation')}
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
                <div className="stat-value">{results.metrics.average_waf.toFixed(2)}x</div>
              </div>
              <div className={`glass-panel stat-card ${config.driveType === 'Hybrid' ? 'hybrid' : ''}`}>
                <div className="stat-label">Cache Hit Ratio</div>
                <div className="stat-value">{(results.metrics.cache_hit_ratio * 100).toFixed(1)}%</div>
              </div>
            </div>

            <div className="glass-panel">
              <h2>Degradation Curve (RUL) - {mode === 'Virtual' ? 'Physics Engine' : 'AI Extrapolation'}</h2>
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
                      stroke={mode === 'Telemetry' ? '#39ff14' : '#00f0ff'} 
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
