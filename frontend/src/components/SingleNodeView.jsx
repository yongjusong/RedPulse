import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import useAppStore from '../store';

export default function SingleNodeView({ t }) {
  const { results, activeTab, mlProgress, targetNode } = useAppStore();

  if (activeTab === 'predictor' && mlProgress !== 'IDLE' && mlProgress !== 'DONE') {
     return (
       <div className="eng-panel" style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', border: 'none'}}>
          <div style={{width: '600px', background: '#18181b', borderRadius: '4px', padding: '20px', fontFamily: 'monospace', color: '#a1a1aa', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'}}>
             <div style={{borderBottom: '1px solid #3f3f46', paddingBottom: '10px', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center'}}>
                <div style={{width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444'}}></div>
                <div style={{width: '12px', height: '12px', borderRadius: '50%', background: '#eab308'}}></div>
                <div style={{width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e'}}></div>
                <span style={{marginLeft: '10px', color: '#d4d4d8', fontWeight: 'bold'}}>LSTM Inference Pipeline: {targetNode}</span>
             </div>
             
             <div style={{display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem'}}>
                <div style={{color: mlProgress === 'COLLECTING' || mlProgress === 'PREPROCESSING' || mlProgress === 'INFERENCING' ? '#22c55e' : '#a1a1aa'}}>
                  {mlProgress === 'COLLECTING' ? '[↻] Extracting Time-series Telemetry via Connector...' : '[✓] Telemetry Extraction Complete'}
                </div>
                
                {(mlProgress === 'PREPROCESSING' || mlProgress === 'INFERENCING') && (
                  <div className="animate-in" style={{color: mlProgress === 'PREPROCESSING' ? '#eab308' : '#22c55e'}}>
                    {mlProgress === 'PREPROCESSING' ? '[↻] Normalizing features (WAF, Temperature, Spare %)...' : '[✓] Feature Normalization & Imputation Complete'}
                  </div>
                )}
                
                {mlProgress === 'INFERENCING' && (
                   <div className="animate-in" style={{color: '#60a5fa'}}>
                      [↻] Forward Pass: Ensemble AI Model (LSTM Layer 1-3)...
                   </div>
                )}
             </div>
             <div style={{marginTop: '30px', borderTop: '1px solid #3f3f46', paddingTop: '10px', fontSize: '0.75rem', color: '#52525b', textAlign: 'right'}}>
                DeepMind / RedPulse Engineering
             </div>
          </div>
       </div>
     );
  }

  if (!results) {
    return (
      <div className="eng-panel" style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#52525b', borderStyle: 'dashed'}}>
        <div style={{fontFamily: 'var(--font-mono)', fontSize: '0.9rem'}}>{t.emptyDash}</div>
      </div>
    );
  }

  const totalDays = results.predicted_rul_days > 0 ? results.predicted_rul_days : 365;
  const targetDays = [0, 0.25, 0.5, 0.75, 1].map(pct => pct * totalDays);

  const keyIndicesRaw = targetDays.map(targetDay => {
    let bestIdx = 0;
    let minDiff = Infinity;
    results.time_series_data.forEach((d, idx) => {
       const diff = Math.abs(d.day - targetDay);
       if (diff < minDiff) {
          minDiff = diff;
          bestIdx = idx;
       }
    });
    return bestIdx;
  });
  
  const keyIndices = [...new Set(keyIndicesRaw)]; // Ensure unique
  const customTicks = keyIndices.map(idx => results.time_series_data[idx].day);

  const renderCustomDot = (props) => {
    const { cx, cy, index } = props;
    if (!keyIndices.includes(index)) return null;
    return <circle cx={cx} cy={cy} r={4} stroke={index === 10 ? "#ef4444" : "#111111"} strokeWidth={2} fill="#fff" key={`dot-${index}`} />;
  };

  const renderCustomLabel = (props) => {
    const { x, y, value, index } = props;
    if (!keyIndices.includes(index)) return null;
    return (
      <text x={x} y={y - 12} fill={index === 10 ? "#ef4444" : "#52525b"} fontSize={11} fontWeight={600} textAnchor="middle" key={`label-${index}`}>
        {value}%
      </text>
    );
  };

  return (
    <>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">{t.predictedLife}</div>
          <div className="stat-value">
            {(results.predicted_rul_days / 365).toFixed(1)} <span style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>{t.years}</span>
          </div>
          <div style={{fontSize: '0.75rem', color: '#16a34a', marginTop: '0.5rem', fontFamily: 'var(--font-mono)'}}>
            TARGET EOL: {new Date(Date.now() + results.predicted_rul_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t.avgWaf}</div>
          <div className="stat-value">{results.metrics.average_waf.toFixed(2)}x</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t.cacheHitRatio}</div>
          <div className="stat-value">{(results.metrics.cache_hit_ratio * 100).toFixed(1)}%</div>
        </div>
      </div>

      {activeTab === 'predictor' && results && results.confidence_lower_days !== undefined && (
         <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
           <div className="glass-panel" style={{ flex: 1, padding: '1rem', borderLeft: '4px solid #6366f1' }}>
              <div style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 'bold', marginBottom: '0.5rem' }}>AI CONFIDENCE INTERVAL</div>
              <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#52525b' }}>
                95% Bound: {Math.floor(results.confidence_lower_days / 365)}y {Math.floor(results.confidence_lower_days % 365)}d ~ {Math.floor(results.confidence_upper_days / 365)}y {Math.floor(results.confidence_upper_days % 365)}d
              </div>
           </div>
           
         </div>
      )}

      <div style={{marginTop: '1rem'}}>
        <h2 style={{fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)'}}>{activeTab === 'simulator' ? t.chartTitleV : t.chartTitleT}</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={results.time_series_data} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis 
                type="number"
                domain={[0, 'dataMax']}
                dataKey="day" 
                stroke="#52525b" 
                ticks={customTicks}
                tickFormatter={(val) => {
                  const d = new Date();
                  d.setDate(d.getDate() + val);
                  return d.toISOString().split('T')[0].substring(0, 7); // YYYY-MM
                }} 
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
                dot={renderCustomDot}
                label={renderCustomLabel}
              />
              <ReferenceLine 
                x={results.time_series_data[results.time_series_data.length - 1].day} 
                stroke="#ef4444" 
                strokeWidth={2}
                strokeDasharray="4 4" 
                label={{ position: 'insideTopLeft', value: t.eolLabel, fill: '#ef4444', fontSize: '0.8rem', fontWeight: 'bold' }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
