import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import useAppStore from '../store';

export default function SingleNodeView({ t }) {
  const { results, mode } = useAppStore();

  if (!results) {
    return (
      <div className="glass-panel" style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#52525b'}}>
        <h2>{t.emptyDash}</h2>
      </div>
    );
  }

  return (
    <>
      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-label">{t.predictedLife}</div>
          <div className="stat-value">
            {(results.predicted_rul_days / 365).toFixed(1)} <span style={{fontSize: '1rem'}}>{t.years}</span>
          </div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-label">{t.avgWaf}</div>
          <div className="stat-value">{results.metrics.average_waf.toFixed(2)}x</div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-label">{t.cacheHitRatio}</div>
          <div className="stat-value">{(results.metrics.cache_hit_ratio * 100).toFixed(1)}%</div>
        </div>
      </div>

      <div className="glass-panel">
        <h2>{mode === 'PreFlight' ? t.chartTitleV : t.chartTitleT}</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={results.time_series_data} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis 
                dataKey="day" 
                stroke="#52525b" 
                tickFormatter={(val) => `${t.xAxisLabel} ${(val/365).toFixed(1)}`} 
              />
              <YAxis stroke="#52525b" domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #d4d4d8' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="health_percent" 
                name={t.yAxisLabel} 
                stroke="#111111" 
                strokeWidth={3} 
                dot={false}
              />
              <ReferenceLine y={0} stroke="#a1a1aa" strokeDasharray="3 3" label={t.eolLabel} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
