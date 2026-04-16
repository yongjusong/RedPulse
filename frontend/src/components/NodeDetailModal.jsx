import React, { useState, useEffect } from 'react';

export default function NodeDetailModal({ node, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (node) {
      setLoading(true);
      fetch(`http://localhost:8000/api/v1/cluster/node/${node.id}/history`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') {
            setHistory(data.data);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error("Error fetching node history", err);
          setLoading(false);
        });
    }
  }, [node]);

  if (!node) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
       <div className="glass-panel" style={{ width: '80%', maxHeight: '80vh', overflowY: 'auto', background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e4e4e7', paddingBottom: '1rem' }}>
             <h2 style={{ margin: 0 }}>Node Details: {node.id.toUpperCase()}</h2>
             <button onClick={onClose} style={{ background: '#f4f4f5', border: '1px solid #d4d4d8', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Close</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', marginBottom: '2rem' }}>
             {node.disks.map(disk => (
               <div key={disk.drive_id} style={{ padding: '10px', border: '1px solid #e4e4e7', borderRadius: '6px', background: disk.severity === 2 ? '#fef2f2' : (disk.severity === 1 ? '#fffbeb' : '#f0fdf4') }}>
                  <div style={{ fontSize: '0.75rem', color: '#71717a' }}>Slot {disk.slot}</div>
                  <div style={{ fontWeight: 'bold' }}>{disk.drive_id}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                     <span>Health: {disk.health}%</span>
                     <span>WAF: {disk.waf}x</span>
                  </div>
               </div>
             ))}
          </div>

          <h3>Telemetry History (Latest 50 events)</h3>
          {loading ? (
             <p>Loading history...</p>
          ) : history.length === 0 ? (
             <p style={{ color: '#71717a' }}>No historical telemetry found in SQLite for this node.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
               <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                     <tr style={{ textAlign: 'left', borderBottom: '2px solid #e4e4e7', background: '#f9fafb' }}>
                        <th style={{ padding: '10px' }}>Timestamp</th>
                        <th style={{ padding: '10px' }}>Disk ID</th>
                        <th style={{ padding: '10px' }}>WAF</th>
                        <th style={{ padding: '10px' }}>Temp</th>
                        <th style={{ padding: '10px' }}>Spare%</th>
                        <th style={{ padding: '10px' }}>PE Cycles</th>
                     </tr>
                  </thead>
                  <tbody>
                     {history.map((entry, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e4e4e7' }}>
                           <td style={{ padding: '10px' }}>{new Date(entry.timestamp).toLocaleString()}</td>
                           <td style={{ padding: '10px', fontWeight: '500' }}>{entry.drive_id}</td>
                           <td style={{ padding: '10px' }}>{entry.waf.toFixed(2)}x</td>
                           <td style={{ padding: '10px' }}>{entry.temperature_c}°C</td>
                           <td style={{ padding: '10px' }}>{entry.available_spare_percent}%</td>
                           <td style={{ padding: '10px' }}>{entry.pe_cycles_used}</td>
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
