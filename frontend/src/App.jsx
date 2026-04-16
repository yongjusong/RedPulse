import React, { useState, useEffect } from 'react';
import useAppStore from './store';
import SingleNodeView from './components/SingleNodeView';
import ClusterView from './components/ClusterView';

const translations = {
  EN: {
    title: "AI-Based SSD Lifespan Simulator",
    virtualMode: "PreFlight Mode",
    telemetryMode: "LiveOps Mode",
    configTitleV: "PreFlight Configuration",
    configTitleT: "LiveOps Telemetry Input",
    vendorModel: "Commercial SSD Database",
    genericCustom: "Generic Parameter (Custom)",
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
    virtualMode: "PreFlight (도입 전 설계)",
    telemetryMode: "LiveOps (라이브 실황)",
    configTitleV: "PreFlight 구성",
    configTitleT: "LiveOps 실측 데이터",
    vendorModel: "상용 모델 DB 템플릿",
    genericCustom: "사용자 직접 입력 (Generic)",
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
    chartTitleV: "Degradation Curve (RUL) - PreFlight",
    chartTitleT: "Degradation Curve (RUL) - LiveOps",
    xAxisLabel: "년",
    yAxisLabel: "SSD 건강 상태 (%)",
    eolLabel: "수명 종료",
    emptyDash: "파라미터를 설정하고 실행 버튼을 눌러 결과를 확인하세요."
  }
};

function App() {
  const [lang, setLang] = useState('EN');
  const t = translations[lang];

  const { mode, setMode, config, setConfig, results, setResults, loading, setLoading } = useAppStore();
  const [vendors, setVendors] = useState([]);
  const [activeTab, setActiveTab] = useState('single');
  
  useEffect(() => {
    fetch('http://localhost:8000/api/v1/models')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setVendors(data.data);
        }
      })
      .catch(err => console.error("Could not load vendor models", err));
  }, []);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const endpoint = mode === 'PreFlight' ? '/simulate' : '/extrapolate';
      const bodyPayload = mode === 'PreFlight' 
        ? {
            modelName: config.modelName || null,
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
        <button onClick={toggleLanguage} style={{ padding: '0.4rem 0.8rem', background: '#f4f4f5', color: '#18181b', border: '1px solid #d4d4d8', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          🌐 {lang === 'EN' ? 'KOR' : 'ENG'}
        </button>
      </header>

      {/* Sidebar Configuration */}
      <aside className="glass-panel config-section">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', borderBottom: '2px solid #e4e4e7', paddingBottom: '0.5rem' }}>
          <span 
            onClick={() => setActiveTab('single')}
            style={{ padding: '0.5rem', cursor: 'pointer', fontWeight: 'bold', borderBottom: activeTab === 'single' ? '2px solid #111' : 'none', color: activeTab === 'single' ? '#111' : '#a1a1aa' }}>
            Simulator
          </span>
          <span 
            onClick={() => setActiveTab('cluster')}
            style={{ padding: '0.5rem', cursor: 'pointer', fontWeight: 'bold', borderBottom: activeTab === 'cluster' ? '2px solid #111' : 'none', color: activeTab === 'cluster' ? '#111' : '#a1a1aa' }}>
            Cluster Grid
          </span>
        </div>

        {activeTab === 'single' && (
          <>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
              <button 
            style={{flex: 1, padding: '0.5rem', background: mode === 'PreFlight' ? '#111' : '#f4f4f5', color: mode === 'PreFlight' ? 'white' : 'black', border: '1px solid #d4d4d8', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem'}}
            onClick={() => setMode('PreFlight')}
          >
            {t.virtualMode}
          </button>
          <button 
            style={{flex: 1, padding: '0.5rem', background: mode === 'LiveOps' ? '#111' : '#f4f4f5', color: mode === 'LiveOps' ? 'white' : 'black', border: '1px solid #d4d4d8', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem'}}
            onClick={() => setMode('LiveOps')}
          >
            {t.telemetryMode}
          </button>
        </div>
      
        <h2>{mode === 'PreFlight' ? t.configTitleV : t.configTitleT}</h2>
        
        {mode === 'PreFlight' && (
          <div className="form-group">
            <label>{t.vendorModel}</label>
            <select 
              className="form-control"
              value={config.modelName}
              onChange={(e) => setConfig({...config, modelName: e.target.value})}
            >
              <option value="">{t.genericCustom}</option>
              {vendors.map(v => (
                <option key={v.id} value={v.id}>{v.vendor} {v.modelName} ({v.type}, {v.tbw} TBW)</option>
              ))}
            </select>
          </div>
        )}
        
        {mode === 'PreFlight' && !config.modelName && (
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
        )}

        {(!config.modelName || mode === 'LiveOps') && (
          <div className="form-group">
            <label>{t.backendCap}</label>
            <input type="number" className="form-control" value={config.capacityGB} 
              onChange={e => setConfig({...config, capacityGB: parseInt(e.target.value)})} />
          </div>
        )}

        {mode === 'PreFlight' && config.driveType === 'Hybrid' && !config.modelName && (
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

        {mode === 'LiveOps' && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <h3 style={{fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '1rem', fontWeight: '600'}}>{t.observedFio}</h3>
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

        <button className="btn-run" onClick={handleSimulate} disabled={loading}>
          {loading ? t.simulating : (mode === 'PreFlight' ? t.runVirtual : t.runML)}
        </button>
        </>
        )}

        {activeTab === 'cluster' && (
          <div style={{ color: '#52525b', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Viewing simulated cluster node data.<br/><br/>Filtering and global controls will be available shortly.
          </div>
        )}
      </aside>

      {/* Main Dashboard Area */}
      <main>
        {activeTab === 'single' ? (
          <SingleNodeView t={t} />
        ) : (
          <ClusterView t={t} />
        )}
      </main>
    </div>
  );
}

export default App;
