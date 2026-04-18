import React from 'react';

export default function AlertPanel({ nodes }) {
  // Extract all disks with severity > 0 across all nodes
  const alertingDisks = nodes.flatMap(node => 
    node.disks
      .filter(disk => disk.severity > 0)
      .map(disk => ({ 
        nodeId: node.id, 
        ...disk 
      }))
  );

  if (alertingDisks.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', marginBottom: '1.5rem', borderRadius: '8px' }}>
         ✅ All <strong>{nodes.reduce((acc, n) => acc + n.disks.length, 0)}</strong> disks in the cluster are performing within normal parameters.
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: '1.2rem', background: '#fff1f2', border: '1px solid #fecaca', marginBottom: '1.5rem', borderRadius: '8px' }}>
       <h3 style={{ margin: '0 0 1rem 0', color: '#991b1b', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🚨 Active Cluster Alerts ({alertingDisks.length})
       </h3>
       <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#991b1b' }}>
                <th style={{ padding: '8px', borderBottom: '1px solid #fecaca', position: 'sticky', top: 0, background: '#fff1f2', zIndex: 1 }}>Node ID</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #fecaca', position: 'sticky', top: 0, background: '#fff1f2', zIndex: 1 }}>Slot</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #fecaca', position: 'sticky', top: 0, background: '#fff1f2', zIndex: 1 }}>Health</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #fecaca', position: 'sticky', top: 0, background: '#fff1f2', zIndex: 1 }}>WAF</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #fecaca', position: 'sticky', top: 0, background: '#fff1f2', zIndex: 1 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {alertingDisks.map((disk, idx) => (
                <tr key={`${disk.nodeId}-${disk.slot}-${idx}`} style={{ borderBottom: '1px solid #fee2e2' }}>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>{disk.nodeId.toUpperCase()}</td>
                  <td style={{ padding: '8px' }}>Slot {disk.slot}</td>
                  <td style={{ padding: '8px', color: disk.severity === 2 ? '#dc2626' : '#d97706', fontWeight: 'bold' }}>
                    {disk.health}%
                  </td>
                  <td style={{ padding: '8px' }}>{disk.waf}x</td>
                  <td style={{ padding: '8px' }}>
                    <span style={{ 
                        fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', 
                        background: disk.severity === 2 ? '#dc2626' : '#d97706', color: 'white' 
                    }}>
                      {disk.severity === 2 ? 'CRITICAL' : 'WARNING'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
       </div>
    </div>
  );
}
