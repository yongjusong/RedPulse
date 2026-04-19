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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '2rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>TCO & Economic Impact Analysis</h1>
          <button 
             onClick={() => window.open('/reports/latest_executive_report.html', '_blank')}
             style={{ padding: '0.6rem 1rem', background: '#111', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>
             Download Executive Report
          </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1px', background: 'var(--border-color)', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
        <div style={{ background: '#fff', padding: '1.5rem', borderTop: '3px solid #3b82f6' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Asset Value</div>
          <div className="mono-text" style={{ fontSize: '2rem', fontWeight: '600', margin: '0.5rem 0' }}>${summary.current_asset_value.toLocaleString()}</div>
          <div className="mono-text" style={{ fontSize: '0.8rem', color: '#16a34a' }}>Initial: ${summary.total_initial_investment.toLocaleString()}</div>
        </div>

        <div style={{ background: '#fff', padding: '1.5rem', borderTop: '3px solid #ef4444' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Risk Exposure</div>
          <div className="mono-text" style={{ fontSize: '2rem', fontWeight: '600', margin: '0.5rem 0', color: '#ef4444' }}>${summary.estimated_risk_exposure.toLocaleString()}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Potential cost of unmanaged failures</div>
        </div>

        <div style={{ background: '#fff', padding: '1.5rem', borderTop: '3px solid #f59e0b' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Next 6M CAPEX Budget</div>
          <div className="mono-text" style={{ fontSize: '2rem', fontWeight: '600', margin: '0.5rem 0', color: '#f59e0b' }}>${summary.replacement_budget_next_6m.toLocaleString()}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Required for {counts.critical} critical disks</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
        <div className="eng-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginTop: 0, fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Asset Depreciation</h3>
          <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '0px', overflow: 'hidden', margin: '1.5rem 0' }}>
            <div style={{ 
              width: `${(summary.current_asset_value / summary.total_initial_investment) * 100}%`, 
              height: '100%', 
              background: '#3b82f6' 
            }} />
          </div>
          <div className="mono-text" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span>DEP: <b>${summary.total_depreciation.toLocaleString()}</b></span>
            <span>REM: <b>{((summary.current_asset_value / summary.total_initial_investment) * 100).toFixed(1)}%</b></span>
          </div>
        </div>

        <div className="eng-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginTop: 0, fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Strategic Insights</h3>
          <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-primary)', lineHeight: '1.8', fontSize: '0.85rem', marginTop: '1rem' }}>
            <li><b className="mono-text">{counts.critical}</b> disks have reached <b>Critical</b> wear levels. Immediate replacement suggested to avoid <b className="mono-text">${(counts.critical * 1000).toLocaleString()}</b> in potential risk.</li>
            <li>Current cluster utilization has consumed <b className="mono-text">{((summary.total_depreciation / summary.total_initial_investment) * 100).toFixed(1)}%</b> of total lifespan value.</li>
            <li>Suggested replacement window: <b>Next 45 days</b> for maximum ROI before failure risk spikes.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
