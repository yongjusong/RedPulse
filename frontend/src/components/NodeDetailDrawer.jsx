import React from 'react';
import { getSeverityColor, getSeverityLabel } from '../api';

export default function NodeDetailDrawer({ node, onClose, onJumpToPredictor }) {
  if (!node) return null;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-header">
          <div>
            <h2 className="mono-text" style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
              {node.id.toUpperCase()}
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Node Detail Analysis
            </span>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Node Summary */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
              <span className={`status-pill ${node.maxSeverity === 2 ? 'status-critical' : (node.maxSeverity === 1 ? 'status-warning' : 'status-healthy')}`}>
                {getSeverityLabel(node.maxSeverity)}
              </span>
              <span className="status-pill" style={{ background: '#f1f5f9', color: '#475569' }}>
                {node.disks.length} Bays Active
              </span>
            </div>
            
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              This node is reporting telemetry across {node.disks.length} physical volumes. 
              {node.maxSeverity > 0 ? " Urgent attention is required for the highlighted volumes below." : " All volumes are operating within normal parameters."}
            </p>

            <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ padding: '10px', background: 'white', border: '1px solid #f1f5f9', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Physical Location</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '2px' }}>{node.location || 'RACK-A-01'}</div>
              </div>
              <div style={{ padding: '10px', background: 'white', border: '1px solid #f1f5f9', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Uptime</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '2px' }}>{node.uptime_days || 124} Days</div>
              </div>
            </div>
          </div>

          {/* Disk Breakdown */}
          <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Volume Inventory
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {node.disks.map(disk => (
              <div key={disk.slot} style={{ 
                padding: '12px', 
                background: '#f8fafc', 
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '10px', 
                    height: '10px', 
                    borderRadius: '50%', 
                    background: getSeverityColor(disk.severity) 
                  }} />
                  <div>
                    <div className="mono-text" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      SLOT {disk.slot}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                       {disk.drive_id || `SSD-${disk.slot}`}
                    </div>
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div className="mono-text" style={{ fontSize: '0.9rem', fontWeight: 600, color: disk.health < 20 ? '#dc2626' : 'inherit' }}>
                    {disk.health.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                    RUL HEALTH
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <button 
            className="btn-run" 
            onClick={() => onJumpToPredictor(node.id)}
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            <span>Launch Deep Analysis</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
