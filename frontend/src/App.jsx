import React, { useState, useEffect } from 'react';
import useAppStore from './store';
import SingleNodeView from './components/SingleNodeView';
import ClusterView from './components/ClusterView';
import EconomicsView from './components/EconomicsView';
import { API_URLS, fetchApi } from './api';

const translations = {
  EN: {
    title: "AI-Based SSD Lifespan Simulator",
    virtualMode: "Design & Simulator",
    telemetryMode: "Real-time Predictor",
    configTitleV: "SSD Design Parameters",
    configTitleT: "Telemetry Observation",
    vendorModel: "SSD Model (Spec)",
    genericCustom: "Generic Parameters",
    customSpec: "Custom Spec SSD (Manually enter TBW)",
    driveTopology: "NAND Topology (Advanced)",
    pureTlc: "TLC Layer (Enterprise)",
    pureQlc: "QLC Layer (Value)",
    hybrid: "Hybrid Cache (SLC+QLC)",
    backendCap: "Capacity (GB)",
    slcCacheSize: "SLC Cache Tier Size (GB)",
    dailyWrites: "Daily Writes (GB/day)",
    randomRatio: "Random I/O Ratio (%)",
    observedFio: "Observed Performance Data",
    wafLabel: "Verified WAF",
    hitRatioLabel: "Cache Hit Ratio",
    runVirtual: "Compute Lifespan",
    runML: "Inference Prediction",
    simulating: "Analyzing...",
    predictedLife: "Estimated Lifespan",
    years: "Years",
    avgWaf: "Effective WAF",
    cacheHitRatio: "Hit Ratio",
    chartTitleV: "RUL Prediction - Simulator",
    chartTitleT: "RUL Prediction - Real-time AI",
    xAxisLabel: "Timeline (Years)",
    yAxisLabel: "Health %",
    eolLabel: "Failure Point",
    emptyDash: "Select parameters to begin intelligence analysis."
  },
  KR: {
    title: "AI 기반 SSD 수명 예측 시뮬레이터",
    virtualMode: "서비스 설계 및 시뮬레이션",
    telemetryMode: "실시간 수명 예측기",
    configTitleV: "SSD 설계 파라미터",
    configTitleT: "텔레메트리 실측 관측",
    vendorModel: "SSD 모델 선택 (스펙)",
    genericCustom: "일반 파라미터 직접설정",
    customSpec: "커스텀 스펙 SSD (TBW 직접 입력)",
    driveTopology: "NAND 토폴로지 (고급 설정)",
    pureTlc: "TLC 레이어 (범용/엔터프라이즈)",
    pureQlc: "QLC 레이어 (대용량/저가형)",
    hybrid: "하이브리드 캐시 (SLC+QLC)",
    backendCap: "용량 (GB)",
    slcCacheSize: "SLC 캐시 용량 (GB)",
    dailyWrites: "일일 쓰기량 (GB/day)",
    randomRatio: "랜덤 I/O 비율 (%)",
    observedFio: "실측 성능 제원",
    wafLabel: "검증된 WAF",
    hitRatioLabel: "캐시 적중률",
    runVirtual: "수명 계산 실행",
    runML: "AI 추론 예측 실행",
    simulating: "분석 중...",
    predictedLife: "예상 잔여 수명",
    years: "년",
    avgWaf: "유효 WAF",
    cacheHitRatio: "적중률",
    chartTitleV: "RUL 예측 - 시뮬레이터",
    chartTitleT: "RUL 예측 - 실시간 AI",
    xAxisLabel: "타임라인 (년)",
    yAxisLabel: "건강 상태 %",
    eolLabel: "수명 종료 지점",
    emptyDash: "파라미터를 설정하여 지능형 분석을 시작하세요."
  }
};

function App() {
  const [lang, setLang] = useState('EN');
  const t = translations[lang];

  const { mode, setMode, config, setConfig, results, setResults, loading, setLoading, activeTab, setTab } = useAppStore();
  const [vendors, setVendors] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [useCustomSpec, setUseCustomSpec] = useState(false);
  
  useEffect(() => {
    fetchApi(API_URLS.MODELS)
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
      const isDesign = mode === 'Design';
      const endpoint = isDesign ? API_URLS.SIMULATE : API_URLS.PREDICT_NODE('mock-node');
      
      let bodyPayload;
      if (isDesign) {
        bodyPayload = {
          modelName: useCustomSpec ? null : (config.modelName || null),
          customTBW: useCustomSpec ? config.customTBW : 0,
          driveType: config.driveType,
          capacityGB: config.capacityGB,
          readWriteRatio: 30,
          dailyWritesGB: config.dailyWritesGB,
          randomSequentialRatio: config.randomSequentialRatio,
          cacheSizeGB: config.cacheSizeGB,
          cachePolicy: config.cachePolicy || 'write-back'
        };
      } else {
        bodyPayload = {
          driveType: config.driveType,
          capacityGB: config.capacityGB,
          readWriteRatio: 30,
          dailyWritesGB: config.dailyWritesGB,
          randomSequentialRatio: config.randomSequentialRatio,
          observed_waf: config.observed_waf,
          observed_hit_ratio: config.observed_hit_ratio
        };
      }

      const url = isDesign ? endpoint : `${endpoint}?lookback=${config.analysisPeriod}`;
      
      const data = await fetchApi(url, {
        method: isDesign ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: isDesign ? JSON.stringify(bodyPayload) : null
      });
      setResults(data);
    } catch (err) {
      console.error(err);
      alert("Please ensure the backend is running.");
    }
    setLoading(false);
  };

  return (
    <div className="dashboard-container">
      <header className="header">
        <div>
          <div className="logo">RED<span>PULSE</span> Intelligence</div>
          <div style={{color: 'var(--text-secondary)'}}>{t.title}</div>
        </div>
        <button onClick={() => setLang(lang === 'EN' ? 'KR' : 'EN')} className="glass-panel" style={{ padding: '0.4rem 0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>
          🌐 {lang === 'EN' ? 'KOR' : 'ENG'}
        </button>
      </header>

      <aside className="glass-panel config-section">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', borderBottom: '2px solid #e4e4e7', paddingBottom: '0.5rem' }}>
          <span onClick={() => setTab('single')} style={{ padding: '0.5rem', cursor: 'pointer', fontWeight: 'bold', borderBottom: activeTab === 'single' ? '2px solid #111' : 'none', color: activeTab === 'single' ? '#111' : '#a1a1aa' }}>Simulator</span>
          <span onClick={() => setTab('cluster')} style={{ padding: '0.5rem', cursor: 'pointer', fontWeight: 'bold', borderBottom: activeTab === 'cluster' ? '2px solid #111' : 'none', color: activeTab === 'cluster' ? '#111' : '#a1a1aa' }}>Cluster Grid</span>
          <span onClick={() => setTab('impact')} style={{ padding: '0.5rem', cursor: 'pointer', fontWeight: 'bold', borderBottom: activeTab === 'impact' ? '2px solid #111' : 'none', color: activeTab === 'impact' ? '#111' : '#a1a1aa' }}>Impact</span>
        </div>

        {activeTab === 'single' && (
          <>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
              <button style={{flex: 1, padding: '0.5rem', background: mode === 'Design' ? '#111' : '#f4f4f5', color: mode === 'Design' ? 'white' : 'black', borderRadius: '4px', fontWeight: 'bold'}} onClick={() => setMode('Design')}>{t.virtualMode}</button>
              <button style={{flex: 1, padding: '0.5rem', background: mode === 'Predictor' ? '#111' : '#f4f4f5', color: mode === 'Predictor' ? 'white' : 'black', borderRadius: '4px', fontWeight: 'bold'}} onClick={() => setMode('Predictor')}>{t.telemetryMode}</button>
            </div>
      
        <h2 style={{fontSize: '1.1rem', marginBottom: '1.2rem'}}>{mode === 'Design' ? t.configTitleV : t.configTitleT}</h2>
        
        {mode === 'Design' && (
          <div className="form-group">
            <label>{t.vendorModel}</label>
            <select className="form-control" value={useCustomSpec ? "custom" : config.modelName} onChange={(e) => {
              if (e.target.value === "custom") {
                setUseCustomSpec(true);
              } else {
                setUseCustomSpec(false);
                setConfig({modelName: e.target.value});
              }
            }}>
              <option value="">{t.genericCustom}</option>
              <option value="custom">✨ {t.customSpec}</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.vendor} {v.modelName}</option>)}
            </select>
          </div>
        )}

        {useCustomSpec && mode === 'Design' && (
          <div className="form-group animate-in" style={{background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px dashed #cbd5e1'}}>
            <label>Spec: TBW (Total Bytes Written)</label>
            <input type="number" className="form-control" value={config.customTBW} onChange={e => setConfig({customTBW: parseInt(e.target.value)})} />
          </div>
        )}
        
         {mode === 'Design' && (
          <div style={{marginBottom: '1rem'}}>
             <div onClick={() => setShowAdvanced(!showAdvanced)} style={{fontSize: '0.8rem', color: '#6366f1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'}}>
               {showAdvanced ? '▼' : '▶'} {t.driveTopology} & Cache Policy
             </div>
             {showAdvanced && (
               <div className="form-group animate-in" style={{marginTop: '0.5rem', background: '#f8fafc', padding: '10px', borderRadius: '8px'}}>
                  <label style={{fontSize: '0.8rem', color: '#64748b'}}>NAND Topology</label>
                  <select className="form-control" value={config.driveType} onChange={(e) => setConfig({driveType: e.target.value})}>
                    <option value="TLC">{t.pureTlc}</option>
                    <option value="QLC">{t.pureQlc}</option>
                    <option value="Hybrid">{t.hybrid}</option>
                  </select>
                  
                  <div style={{marginTop: '10px'}}>
                    <label style={{fontSize: '0.8rem', color: '#64748b'}}>OS Cache Policy (Software Tiering)</label>
                    <select className="form-control" value={config.cachePolicy || 'write-back'} onChange={e => setConfig({cachePolicy: e.target.value})}>
                      <option value="write-back">Write-Back (Cache Enabled)</option>
                      <option value="write-through">Write-Through (Direct to Disk)</option>
                    </select>
                  </div>
               </div>
             )}
          </div>
        )}

        <div className="form-group">
          <label>{t.backendCap}</label>
          <input type="number" className="form-control" value={config.capacityGB} onChange={e => setConfig({capacityGB: parseInt(e.target.value)})} />
        </div>

        <div className="form-group">
          <label>{t.dailyWrites}</label>
          <input type="number" className="form-control" value={config.dailyWritesGB} onChange={e => setConfig({dailyWritesGB: parseInt(e.target.value)})} />
        </div>

        <div className="form-group">
          <label>{t.randomRatio} : {config.randomSequentialRatio}%</label>
          <input type="range" min="0" max="100" className="form-control" value={config.randomSequentialRatio} onChange={e => setConfig({randomSequentialRatio: parseInt(e.target.value)})} />
        </div>

        {mode === 'Predictor' && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <h3 style={{fontSize: '0.9rem', marginBottom: '1rem', fontWeight: '600'}}>{t.observedFio}</h3>
            <div className="form-group">
              <label>{t.wafLabel}</label>
              <input type="number" step="0.1" className="form-control" value={config.observed_waf} onChange={e => setConfig({observed_waf: parseFloat(e.target.value)})} />
            </div>
            <div className="form-group" style={{marginTop: '1.5rem', borderTop: '1px solid #e4e4e7', paddingTop: '1rem'}}>
               <label style={{fontWeight: '600'}}>Analysis Period</label>
               <select className="form-control" value={config.analysisPeriod} onChange={e => setConfig({analysisPeriod: parseInt(e.target.value)})}>
                 <option value="7">Last 7 Days</option>
                 <option value="14">Last 14 Days</option>
                 <option value="30">Last 30 Days</option>
               </select>
            </div>
          </div>
        )}

        <button className="btn-run" onClick={handleSimulate} disabled={loading}>{loading ? t.simulating : t.runVirtual}</button>
        </>
        )}
      </aside>

      <main>
        {activeTab === 'single' ? <SingleNodeView t={t} /> : activeTab === 'cluster' ? <ClusterView t={t} /> : <EconomicsView />}
      </main>
    </div>
  );
}

export default App;
