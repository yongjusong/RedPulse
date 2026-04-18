import React, { useState, useEffect } from 'react';
import { API_URLS, fetchApi } from '../api';

export default function EconomicsView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi(API_URLS.ECONOMICS)
      .then(json => {
        if (json.status === 'success') {
          setData(json.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching economics summary", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Calculating financial impact...</div>;
  if (!data) return <div>Failed to load economic data.</div>;

  const { summary, counts } = data;

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ margin: 0 }}>💰 TCO & Economic Impact Analysis</h1>
          <button 
             onClick={() => window.open('/reports/latest_executive_report.html', '_blank')}
             style={{ padding: '0.8rem 1.5rem', background: '#111', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
             📄 Download Executive Report (Auto-Generated)
          </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '5px solid #3b82f6' }}>
          <div style={{ fontSize: '0.85rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Asset Value</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>${summary.current_asset_value.toLocaleString()}</div>
          <div style={{ fontSize: '0.9rem', color: '#10b981' }}>Initial: ${summary.total_initial_investment.toLocaleString()}</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '5px solid #ef4444' }}>
          <div style={{ fontSize: '0.85rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Risk Exposure (Downtime)</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0.5rem 0', color: '#ef4444' }}>${summary.estimated_risk_exposure.toLocaleString()}</div>
          <div style={{ fontSize: '0.9rem', color: '#71717a' }}>Potential cost of unmanaged failures</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '5px solid #f59e0b' }}>
          <div style={{ fontSize: '0.85rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Next 6M CAPEX Budget</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0.5rem 0', color: '#f59e0b' }}>${summary.replacement_budget_next_6m.toLocaleString()}</div>
          <div style={{ fontSize: '0.9rem', color: '#71717a' }}>Required for {counts.critical} critical disks</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginTop: 0 }}>Asset Depreciation</h3>
          <div style={{ height: '20px', background: '#f4f4f5', borderRadius: '10px', overflow: 'hidden', margin: '1.5rem 0' }}>
            <div style={{ 
              width: `${(summary.current_asset_value / summary.total_initial_investment) * 100}%`, 
              height: '100%', 
              background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' 
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
            <span>Depreciated: <b>${summary.total_depreciation.toLocaleString()}</b></span>
            <span>Remaining: <b>{((summary.current_asset_value / summary.total_initial_investment) * 100).toFixed(1)}%</b></span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginTop: 0 }}>Strategic Insights</h3>
          <ul style={{ paddingLeft: '1.2rem', color: '#3f3f46', lineHeight: '1.8' }}>
            <li><b>{counts.critical}</b> disks have reached <b>Critical</b> wear levels. Immediate replacement suggested to avoid <b>${(counts.critical * 1000).toLocaleString()}</b> in potential risk.</li>
            <li>Current cluster utilization has consumed <b>{((summary.total_depreciation / summary.total_initial_investment) * 100).toFixed(1)}%</b> of total lifespan value.</li>
            <li>Suggested replacement window: <b>Next 45 days</b> for maximum ROI before failure risk spikes.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
