import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const translations = {
  EN: {
    title: "AI-Based SSD Lifespan Simulator",
    virtualMode: "Virtual Mode",
    telemetryMode: "Telemetry Mode",
    configTitleV: "Virtual Topology",
    configTitleT: "Telemetry Input",
    driveTopology: "Drive Topology",
    pureTlc: "Pure TLC (High Endurance)",
    pureQlc: "Pure QLC (High Capacity)",
    hybrid: "Device-Mapper Hybrid (SLC+QLC)",
    backendCap: "Backend Capacity (GB)",
    slcCacheSize: "SLC Cache Tier Size (GB)",
    dailyWrites: "Daily Writes (GB/day)",
    randomRatio: "Random I/O Ratio (%)",
    observedFio: "Observed Fio Data (1hr test)",
    wafLabel: "Actual Write Amplification (WAF)",
    hitRatioLabel: "Actual Cache Hit Ratio (0 to 1)",
    runVirtual: "Run Virtual Engine",
    runML: "Run ML Extrapolation",
    simulating: "Simulating...",
    predictedLife: "Predicted Lifespan",
    years: "Years",
    avgWaf: "Average WAF",
    cacheHitRatio: "Cache Hit Ratio",
    chartTitleV: "Degradation Curve (RUL) - Physics Engine",
    chartTitleT: "Degradation Curve (RUL) - AI Extrapolation",
    xAxisLabel: "Year",
    yAxisLabel: "SSD Health %",
    eolLabel: "End of Life",
    emptyDash: "Configure parameters and run simulation to view insights."
  },
  KR: {
    title: "AI 기반 SSD 수명 예측 시뮬레이터",
    virtualMode: "가상 시뮬레이션",
    telemetryMode: "실측 AI 추론",
    configTitleV: "가상 환경 구성",
    configTitleT: "실측치 기반 입력",
    driveTopology: "디바이스 토폴로지",
    pureTlc: "순수 TLC (고내구성)",
    pureQlc: "순수 QLC (고용량)",
    hybrid: "하이브리드 캐시 (SLC+QLC)",
    backendCap: "백엔드 전체 용량 (GB)",
    slcCacheSize: "SLC 캐시 용량 (GB)",
    dailyWrites: "일일 쓰기량 (GB/day)",
    randomRatio: "랜덤 I/O 비율 (%)",
    observedFio: "실측 테스트 결과 (1시간)",
    wafLabel: "실측 쓰기 증폭률 (WAF)",
    hitRatioLabel: "실측 캐시 적중률 (0 ~ 1.0)",
    runVirtual: "가상 수명 계산",
    runML: "AI 외삽 추론 실행",
    simulating: "시뮬레이션 중...",
    predictedLife: "예측된 잔여 수명",
    years: "년",
    avgWaf: "평균 쓰기 증폭",
    cacheHitRatio: "캐시 적중률",
    chartTitleV: "노후화 궤적 (RUL) - 물리 연산",
    chartTitleT: "노후화 궤적 (RUL) - AI 외삽 연산",
    xAxisLabel: "년",
    yAxisLabel: "SSD 건강 상태 (%)",
    eolLabel: "수명 종료",
    emptyDash: "파라미터를 설정하고 실행 버튼을 눌러 결과를 확인하세요."
  }
};

function App() {
  const [lang, setLang] = useState('EN');
  const t = translations[lang];

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [mode, setMode] = useState('Virtual'); // 'Virtual' or 'Telemetry'
  
  const [config, setConfig] = useState({
    driveType: 'QLC',
    capacityGB: 4000,
    dailyWritesGB: 2000, 
    randomSequentialRatio: 80, 
    cacheSizeGB: 100,
    observed_waf: 2.1, 
    observed_hit_ratio: 0.45 
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

  const toggleLanguage = () => {
    setLang(lang === 'EN' ? 'KR' : 'EN');
  };

  return (
    <div className="dashboard-container">
      <header className="header" style={{ position: 'relative' }}>
        <div>
          <div className="logo">RED<span>PULSE</span></div>
          <div style={{color: 'var(--text-secondary)'}}>{t.title}</div>
        </div>
        <button 
          onClick={toggleLanguage}
          style={{
            position: 'absolute', top: '10px', right: '10px',
            background: 'var(--panel-bg)', color: 'var(--text-primary)',
            border: '1px solid rgba(255,255,255,0.2)', padding: '5px 15px',
            borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold'
          }}
        >
          🌐 {lang === 'EN' ? 'KOR' : 'ENG'}
        </button>
      </header>

      {/* Sidebar Configuration */}
      <aside className="glass-panel config-section">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
          <button 
            style={{flex: 1, padding: '0.5rem', background: mode === 'Virtual' ? 'var(--accent-blue)' : 'rgba(0,0,0,0.3)', color: mode === 'Virtual' ? 'black' : 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem'}}
            onClick={() => setMode('Virtual')}
          >
            {t.virtualMode}
          </button>
          <button 
            style={{flex: 1, padding: '0.5rem', background: mode === 'Telemetry' ? 'var(--accent-green)' : 'rgba(0,0,0,0.3)', color: mode === 'Telemetry' ? 'black' : 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem'}}
            onClick={() => setMode('Telemetry')}
          >
            {t.telemetryMode}
          </button>
        </div>
      
        <h2>{mode === 'Virtual' ? t.configTitleV : t.configTitleT}</h2>
        
        <div className="form-group">
          <label>{t.driveTopology}</label>
          <select 
            className="form-control"
            value={config.driveType}
            onChange={(e) => setConfig({...config, driveType: e.target.value})}
          >
            <option value="TLC">{t.pureTlc}</option>
            <option value="QLC">{t.pureQlc}</option>
            <option value="Hybrid">{t.hybrid}</option>
          </select>
        </div>

        <div className="form-group">
          <label>{t.backendCap}</label>
          <input type="number" className="form-control" value={config.capacityGB} 
            onChange={e => setConfig({...config, capacityGB: parseInt(e.target.value)})} />
        </div>

        {config.driveType === 'Hybrid' && (
          <div className="form-group">
            <label>{t.slcCacheSize}</label>
            <input type="number" className="form-control" value={config.cacheSizeGB} 
              onChange={e => setConfig({...config, cacheSizeGB: parseInt(e.target.value)})} />
          </div>
        )}

        <div className="form-group">
          <label>{t.dailyWrites}</label>
          <input type="number" className="form-control" value={config.dailyWritesGB} 
            onChange={e => setConfig({...config, dailyWritesGB: parseInt(e.target.value)})} />
        </div>

        <div className="form-group">
          <label>{t.randomRatio} : {config.randomSequentialRatio}%</label>
          <input type="range" min="0" max="100" className="form-control" 
            value={config.randomSequentialRatio} 
            onChange={e => setConfig({...config, randomSequentialRatio: parseInt(e.target.value)})} />
        </div>

        {mode === 'Telemetry' && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{fontSize: '0.9rem', color: 'var(--accent-green)', marginBottom: '1rem'}}>{t.observedFio}</h3>
            <div className="form-group">
              <label>{t.wafLabel}</label>
              <input type="number" step="0.1" className="form-control" value={config.observed_waf} 
                onChange={e => setConfig({...config, observed_waf: parseFloat(e.target.value)})} />
            </div>
            {config.driveType === 'Hybrid' && (
              <div className="form-group">
                <label>{t.hitRatioLabel}</label>
                <input type="number" step="0.05" className="form-control" value={config.observed_hit_ratio} 
                  onChange={e => setConfig({...config, observed_hit_ratio: parseFloat(e.target.value)})} />
              </div>
            )}
          </div>
        )}

        <button className="btn-run" onClick={handleSimulate} disabled={loading} style={{ background: mode === 'Telemetry' ? 'linear-gradient(135deg, #39ff14 0%, #20b2aa 100%)' : '' }}>
          {loading ? t.simulating : (mode === 'Virtual' ? t.runVirtual : t.runML)}
        </button>
      </aside>

      {/* Main Dashboard Area */}
      <main>
        {results ? (
          <>
            <div className="stats-grid">
              <div className="glass-panel stat-card">
                <div className="stat-label">{t.predictedLife}</div>
                <div className="stat-value" style={{color: results.predicted_rul_days > 1000 ? '#39ff14' : '#ff3366'}}>
                  {(results.predicted_rul_days / 365).toFixed(1)} <span style={{fontSize: '1rem'}}>{t.years}</span>
                </div>
              </div>
              <div className="glass-panel stat-card">
                <div className="stat-label">{t.avgWaf}</div>
                <div className="stat-value">{results.metrics.average_waf.toFixed(2)}x</div>
              </div>
              <div className={`glass-panel stat-card ${config.driveType === 'Hybrid' ? 'hybrid' : ''}`}>
                <div className="stat-label">{t.cacheHitRatio}</div>
                <div className="stat-value">{(results.metrics.cache_hit_ratio * 100).toFixed(1)}%</div>
              </div>
            </div>

            <div className="glass-panel">
              <h2>{mode === 'Virtual' ? t.chartTitleV : t.chartTitleT}</h2>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={results.time_series_data} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="day" 
                      stroke="#94a3b8" 
                      tickFormatter={(val) => `${t.xAxisLabel} ${(val/365).toFixed(1)}`} 
                    />
                    <YAxis stroke="#94a3b8" domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(22, 30, 46, 0.9)', border: '1px solid #00f0ff' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="health_percent" 
                      name={t.yAxisLabel} 
                      stroke={mode === 'Telemetry' ? '#39ff14' : '#00f0ff'} 
                      strokeWidth={3} 
                      dot={false}
                    />
                    <ReferenceLine y={0} stroke="#ff3366" strokeDasharray="3 3" label={t.eolLabel} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : (
          <div className="glass-panel" style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8'}}>
            <h2>{t.emptyDash}</h2>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
