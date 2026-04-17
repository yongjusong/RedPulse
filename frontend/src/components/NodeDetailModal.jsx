import React, { useState, useEffect } from 'react';
import { API_URLS, fetchApi } from '../api';

export default function NodeDetailModal({ node, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    const loadNodeData = async () => {
      try {
        const histData = await fetchApi(API_URLS.NODE_HISTORY(node.id));
        if (histData.status === 'success') {
          setHistory(histData.data);
        }

        const predData = await fetchApi(API_URLS.PREDICT_NODE(node.id));
        if (predData.status === 'success') {
          setPrediction(predData);
        }
      } catch (err) {
        console.error("Error loading node details", err);
      } finally {
        setLoading(false);
      }
    };

    loadNodeData();
  }, [node.id]);

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="glass-panel" style={{
        width: '90%', maxWidth: '800px', maxHeight: '90vh',
        overflowY: 'auto', padding: '2rem', position: 'relative',
        background: 'white'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '20px', right: '20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
        >
          ✕
        </button>

        <h2 style={{ marginBottom: '1.5rem' }}>Node Intelligence: {node.id.toUpperCase()}</h2>

        {prediction && (
           <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', borderLeft: '4px solid #6366f1' }}>
              <div style={{ fontSize: '0.9rem', color: '#6366f1', fontWeight: 'bold', marginBottom: '0.5rem' }}>AI ANALYSIS RESULT</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                Estimated RUL: {Math.floor(prediction.predicted_rul_days / 365)} Years {Math.floor(prediction.predicted_rul_days % 365)} Days
              </div>
              {prediction.confidence_lower_days !== undefined && prediction.confidence_upper_days !== undefined && (
                <div style={{ fontSize: '0.9rem', color: '#10b981', marginTop: '0.3rem', fontWeight: '500' }}>
                  Confidence Interval (95%): {Math.floor(prediction.confidence_lower_days / 365)}y {Math.floor(prediction.confidence_lower_days % 365)}d ~ {Math.floor(prediction.confidence_upper_days / 365)}y {Math.floor(prediction.confidence_upper_days % 365)}d
                </div>
              )}
              <div style={{ fontSize: '0.8rem', color: '#71717a', marginTop: '0.5rem' }}>
                Based on {prediction.sample_points} telemetry samples collected.
              </div>
           </div>
        )}

        {prediction && prediction.optimal_replacement_days !== undefined && (
           <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', borderLeft: '4px solid #10b981', background: '#f0fdf4' }}>
              <div style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 'bold', marginBottom: '0.5rem' }}>FINOPS AI TCO RECOMMENDATION</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#065f46' }}>
                Optimal Replacement: {Math.floor(prediction.optimal_replacement_days / 365)}y {Math.floor(prediction.optimal_replacement_days % 365)}d from now
              </div>
              <div style={{ fontSize: '0.9rem', color: '#047857', marginTop: '0.5rem', fontWeight: '500' }}>
                Estimated Savings: ${prediction.financial_savings_usd.toLocaleString()} per node
              </div>
              <div style={{ fontSize: '0.8rem', color: '#059669', marginTop: '0.3rem' }}>
                Calculated by minimizing downtime risk penalty curve vs unamortized hardware residual value.
              </div>
           </div>
        )}

        <h3>Historical Telemetry (Last 30 Points)</h3>
        {loading ? (
          <div>Analyzing historical trends...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e4e4e7' }}>
                  <th style={{ padding: '0.5rem' }}>Timestamp</th>
                  <th style={{ padding: '0.5rem' }}>Drive</th>
                  <th style={{ padding: '0.5rem' }}>WAF</th>
                  <th style={{ padding: '0.5rem' }}>Temp</th>
                  <th style={{ padding: '0.5rem' }}>Spare %</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={h.id || i} style={{ borderBottom: '1px solid #f4f4f5' }}>
                    <td style={{ padding: '0.5rem' }}>{h.timestamp}</td>
                    <td style={{ padding: '0.5rem' }}>{h.drive_id}</td>
                    <td style={{ padding: '0.5rem' }}>{h.waf.toFixed(2)}</td>
                    <td style={{ padding: '0.5rem' }}>{h.temperature_c}°C</td>
                    <td style={{ padding: '0.5rem' }}>{h.available_spare_percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
