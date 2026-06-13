import React, { useState, useEffect } from 'react';
import useAppStore from './store';
import SingleNodeView from './components/SingleNodeView';
import ClusterView from './components/ClusterView';
import { API_URLS, fetchApi } from './api';

const translations = {
  EN: {
    title: "AI-Based SSD Lifespan Simulator",
    simMode: "Simulator",
    telemetryMode: "Single Drive AI",
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
    configTitleT: "텔레메트 실측 관측",
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

  const { config, setConfig, results, setResults, loading, setLoading, activeTab, setTab, targetNode, setTargetNode, targetDrive, setTargetDrive, mlProgress, setMlProgress, telemetryStatus, setTelemetryStatus } = useAppStore();
  const [vendors, setVendors] = useState([]);
  const [availableNodes, setAvailableNodes] = useState([]);
  const [availableDrives, setAvailableDrives] = useState([]);
  const [searchString, setSearchString] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [useCustomSpec, setUseCustomSpec] = useState(false);
  const [showAddModelForm, setShowAddModelForm] = useState(false);
  const [isEditingModel, setIsEditingModel] = useState(false);
  const [newModelData, setNewModelData] = useState({ vendor: '', modelName: '', type: 'TLC', capacityGB: 1000, tbw: 1000 });
  
  useEffect(() => {
    fetchApi(API_URLS.MODELS)
      .then(data => {
        if (data.status === 'success') {
          setVendors(data.data);
          if (data.data.length > 0 && !config.modelName) {
             const defaultModel = data.data.find(v => v.modelName === 'PM1743' || v.modelName === 'BM1743' || v.vendor === 'Samsung') || data.data[0];
             const displayStr = `[${defaultModel.vendor}] ${defaultModel.modelName} (TBW: ${defaultModel.tbw})`;
             setSearchString(displayStr);
             setConfig({
                 modelName: defaultModel.id, 
                 capacityGB: defaultModel.capacityGB || 7680, 
                 dailyWritesGB: 1000,
                 randomSequentialRatio: 80 
             });
          }
        }
      })
      .catch(err => console.error("Could not load vendor models", err));
  }, []);

  useEffect(() => {
    if (activeTab === 'predictor') {
      fetchApi(API_URLS.TOPOLOGY)
        .then(res => {
          if (res.status === 'success') {
             setAvailableNodes(res.data.map(n => n.id || n.node_name));
          }
        })
        .catch(err => console.error('Failed to fetch available nodes', err));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'predictor' && targetNode) {
      setTargetDrive(null);
      setAvailableDrives([]);
      setTelemetryStatus(null);
      fetchApi(API_URLS.NODE_DRIVES(targetNode))
        .then(res => {
          if (res.status === 'success') {
             setAvailableDrives(res.data);
          }
        })
        .catch(err => console.error('Failed to fetch available drives', err));
    }
  }, [activeTab, targetNode]);

  const handleCheckTelemetry = async () => {
    if (!targetNode || !targetDrive) return;
    setLoading(true);
    try {
      const data = await fetchApi(`${API_URLS.NODE_HISTORY(targetNode)}?drive=${targetDrive}`);
      if (data.status === 'success') {
         // Approx subset logic for visualization effect
         const factor = config.collectionInterval === 1 ? 24 : (config.collectionInterval === 6 ? 4 : (config.collectionInterval === 12 ? 2 : 1));
         const points = data.data.length > 0 ? (config.analysisPeriod * factor) : 0;
         setTelemetryStatus(points || data.data.length);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to fetch backend history table.");
    }
    setLoading(false);
  };

  const handleSimulate = async () => {
    setLoading(true);
    try {
      if (activeTab === 'simulator') {
        const url = API_URLS.SIMULATE;
        const bodyPayload = {
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
        const data = await fetchApi(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bodyPayload) });
        setResults(data);
      } else if (activeTab === 'predictor') {
        const nodeToPredict = targetNode || 'mock-node';
        const url = `${API_URLS.PREDICT_NODE(nodeToPredict)}?lookback=${config.analysisPeriod}&interval=${config.collectionInterval}${targetDrive ? `&drive=${targetDrive}` : ''}`;
        
        // Artificial Pipeline Sequence Setup for AI UX
        setMlProgress('COLLECTING');
        await new Promise(r => setTimeout(r, 800));
        setMlProgress('PREPROCESSING');
        await new Promise(r => setTimeout(r, 800));
        setMlProgress('INFERENCING');
        await new Promise(r => setTimeout(r, 800));

        const data = await fetchApi(url, { method: 'GET' });
        setResults(data);
        setMlProgress('DONE');
        setTimeout(() => setMlProgress('IDLE'), 2000); // clear after 2 seconds to revert to normal chart
      }
    } catch (err) {
      console.error(err);
      alert("Please ensure the backend is running.");
    }
    setLoading(false);
  };

  return (
    <div className="app-wrapper">
      <header className="doc-header">
        <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
          <div className="logo">RED<span>PULSE</span></div>
          <div className="doc-tabs" style={{marginBottom: 0, borderBottom: 'none'}}>
            <div className={`doc-tab ${activeTab === 'simulator' ? 'active' : ''}`} onClick={() => setTab('simulator')} style={{color: activeTab === 'simulator' ? '#fff' : '#a1a1aa', borderBottom: activeTab === 'simulator' ? '2px solid #fff' : '2px solid transparent'}}>Simulator</div>
            <div className={`doc-tab ${activeTab === 'predictor' ? 'active' : ''}`} onClick={() => setTab('predictor')} style={{color: activeTab === 'predictor' ? '#fff' : '#a1a1aa', borderBottom: activeTab === 'predictor' ? '2px solid #fff' : '2px solid transparent'}}>Single Drive AI</div>
            <div className={`doc-tab ${activeTab === 'cluster' ? 'active' : ''}`} onClick={() => setTab('cluster')} style={{color: activeTab === 'cluster' ? '#fff' : '#a1a1aa', borderBottom: activeTab === 'cluster' ? '2px solid #fff' : '2px solid transparent'}}>Cluster Grid</div>
          </div>
        </div>
        <div>
          <button onClick={() => setLang(lang === 'EN' ? 'KR' : 'EN')} style={{ background: 'transparent', color: '#fff', border: '1px solid #52525b', padding: '0.2rem 0.5rem', cursor: 'pointer', borderRadius: '2px', fontSize: '0.8rem' }}>
            {lang === 'EN' ? 'KOR' : 'ENG'}
          </button>
        </div>
      </header>

      <div className="content-wrapper">
        {activeTab === 'simulator' && (
        <aside className="doc-sidebar config-section">
          <h2>{t.configTitleV}</h2>
          
          <div className="form-group">
            <label>{t.vendorModel}</label>
            <select 
              className="form-control"
              value={useCustomSpec ? "custom" : (config.modelName || "")}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "add_new") {
                  setShowAddModelForm(true);
                  setIsEditingModel(false);
                  setNewModelData({ vendor: '', modelName: '', type: 'TLC', capacityGB: 1000, tbw: 1000 });
                  setUseCustomSpec(false);
                } else if (val === "custom") {
                  setUseCustomSpec(true);
                  setShowAddModelForm(false);
                  setConfig({modelName: null});
                } else {
                  setUseCustomSpec(false);
                  setShowAddModelForm(false);
                  const match = vendors.find(v => v.id === val);
                  if (match) {
                    setConfig({modelName: match.id, capacityGB: match.capacityGB});
                  }
                }
              }}
            >
              <option value="" disabled>Select SSD Model...</option>
              <option value="add_new">+ Add New SSD Model</option>
              <option value="custom">{t.customSpec}</option>
              {vendors.map(v => (
                <option key={v.id} value={v.id}>[{v.vendor}] {v.modelName} (TBW: {v.tbw})</option>
              ))}
            </select>
            
            {config.modelName && !showAddModelForm && !useCustomSpec && (
              <div style={{display: 'flex', gap: '12px', marginTop: '8px', justifyContent: 'flex-end'}}>
                <button onClick={() => {
                   const match = vendors.find(v => v.id === config.modelName);
                   if (match) {
                      setNewModelData({vendor: match.vendor, modelName: match.modelName, type: match.type || 'TLC', capacityGB: match.capacityGB, tbw: match.tbw});
                      setIsEditingModel(true);
                      setShowAddModelForm(true);
                   }
                }} style={{background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600}}>Edit Spec</button>
                
                <button onClick={async () => {
                   if (window.confirm('Are you sure you want to delete this SSD model?')) {
                      try {
                         const res = await fetchApi(API_URLS.DELETE_MODEL(config.modelName), {method: 'DELETE'});
                         if (res.status === 'success') {
                            setVendors(vendors.filter(v => v.id !== config.modelName));
                            setConfig({modelName: null});
                         }
                      } catch (e) {
                         console.error('Delete failed', e);
                      }
                   }
                }} style={{background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600}}>Delete</button>
              </div>
            )}
          </div>

          {useCustomSpec && (
            <div className="form-group animate-in" style={{background: '#f1f5f9', padding: '10px', borderLeft: '3px solid #3b82f6'}}>
              <label>Spec: TBW (Total Bytes Written)</label>
              <input type="number" className="form-control" value={config.customTBW} onChange={e => setConfig({customTBW: parseInt(e.target.value)})} />
            </div>
          )}

          {showAddModelForm && (
            <div className="form-group animate-in" style={{background: '#fcfcfc', border: '1px solid var(--border-color)', padding: '15px', borderRadius: '4px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                  <h3 style={{marginTop: 0, marginBottom: 0, fontSize: '0.9rem'}}>{isEditingModel ? "Edit SSD Model" : "Create Custom SSD"}</h3>
                  <button onClick={() => {setShowAddModelForm(false); setIsEditingModel(false);}} style={{background: 'transparent', border: 'none', cursor: 'pointer', color: '#a1a1aa'}}>✕</button>
              </div>
              
              <label>Vendor</label>
              <input type="text" className="form-control" value={newModelData.vendor} onChange={e => setNewModelData({...newModelData, vendor: e.target.value})} style={{marginBottom: '10px'}} placeholder="e.g. Sony" />
              
              <label>Model Name</label>
              <input type="text" className="form-control" value={newModelData.modelName} onChange={e => setNewModelData({...newModelData, modelName: e.target.value})} style={{marginBottom: '10px'}} placeholder="e.g. HyperDrive" />
              
              <div style={{display: 'flex', gap: '10px', marginBottom: '10px'}}>
                <div style={{flex: 1}}>
                  <label>Type</label>
                  <select className="form-control" value={newModelData.type} onChange={e => setNewModelData({...newModelData, type: e.target.value})}>
                    <option value="SLC">SLC</option>
                    <option value="TLC">TLC</option>
                    <option value="QLC">QLC</option>
                  </select>
                </div>
                <div style={{flex: 1}}>
                  <label>Capacity</label>
                  <input type="number" className="form-control" value={newModelData.capacityGB} onChange={e => setNewModelData({...newModelData, capacityGB: parseInt(e.target.value)})} />
                </div>
                <div style={{flex: 1}}>
                  <label>TBW</label>
                  <input type="number" className="form-control" value={newModelData.tbw} onChange={e => setNewModelData({...newModelData, tbw: parseInt(e.target.value)})} />
                </div>
              </div>
              
              <button 
                onClick={async () => {
                  try {
                    const url = isEditingModel ? API_URLS.UPDATE_MODEL(config.modelName) : API_URLS.ADD_MODEL;
                    const method = isEditingModel ? 'PUT' : 'POST';
                    const res = await fetchApi(url, {
                      method: method,
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(newModelData)
                    });
                    if (res.status === 'success') {
                       if (isEditingModel) {
                          setVendors(vendors.map(v => v.id === config.modelName ? res.data : v));
                       } else {
                          setVendors([...vendors, res.data]);
                       }
                       setShowAddModelForm(false);
                       setIsEditingModel(false);
                       setConfig({modelName: res.data.id, capacityGB: res.data.capacityGB});
                    }
                  } catch (e) {
                     console.error('Failed to save model', e);
                     alert('Failed to save new model. See console.');
                  }
                }}
                style={{width: '100%', padding: '0.6rem', background: 'var(--accent-base)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}>
                {isEditingModel ? "Save Changes" : "Save & Select Model"}
              </button>
            </div>
          )}
          
          <div style={{marginBottom: '1rem'}}>
             <div onClick={() => setShowAdvanced(!showAdvanced)} style={{fontSize: '0.75rem', fontWeight: '600', color: '#2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'}}>
               {showAdvanced ? '▼' : '▶'} {t.driveTopology} & Cache Policy
             </div>
             {showAdvanced && (
               <div className="form-group animate-in" style={{marginTop: '0.5rem', background: '#f1f5f9', padding: '10px', borderLeft: '3px solid #64748b'}}>
                  <label style={{color: '#475569'}}>NAND Topology</label>
                  <select className="form-control" value={config.driveType} onChange={(e) => setConfig({driveType: e.target.value})}>
                    <option value="TLC">{t.pureTlc}</option>
                    <option value="QLC">{t.pureQlc}</option>
                    <option value="Hybrid">{t.hybrid}</option>
                  </select>
                  
                  <div style={{marginTop: '10px'}}>
                    <label style={{color: '#475569'}}>OS Cache Policy</label>
                    <select className="form-control" value={config.cachePolicy || 'write-back'} onChange={e => setConfig({cachePolicy: e.target.value})}>
                      <option value="write-back">Write-Back (Cache Enabled)</option>
                      <option value="write-through">Write-Through (Direct)</option>
                    </select>
                  </div>
               </div>
             )}
          </div>

          <div className="form-group">
            <label>{t.backendCap}</label>
            <input type="number" className="form-control" value={config.capacityGB} onChange={e => setConfig({capacityGB: parseInt(e.target.value)})} />
          </div>

          <div className="form-group">
            <label>{t.dailyWrites}</label>
            <input type="number" className="form-control" value={config.dailyWritesGB} onChange={e => setConfig({dailyWritesGB: parseInt(e.target.value)})} />
          </div>

          <div className="form-group">
            <label>{t.randomRatio} : <span className="mono-text">{config.randomSequentialRatio}%</span></label>
            <input type="range" min="0" max="100" style={{width: '100%', marginTop: '5px'}} value={config.randomSequentialRatio} onChange={e => setConfig({randomSequentialRatio: parseInt(e.target.value)})} />
          </div>

          <button className="btn-run" onClick={handleSimulate} disabled={loading}>{loading ? t.simulating : t.runVirtual}</button>
        </aside>
        )}

        {activeTab === 'predictor' && (
        <aside className="doc-sidebar config-section">
          <h2>Machine Learning Target</h2>
          <div className="form-group" style={{marginTop: '1rem'}}>
             <label>Select Node ID</label>
             <input 
               type="text" 
               list="connected-nodes" 
               className="form-control" 
               placeholder="-- Select or Type Connected Target --" 
               value={targetNode || ''} 
               onChange={e => { setTargetNode(e.target.value); setTelemetryStatus(null); }} 
               autoComplete="off"
             />
             <datalist id="connected-nodes">
               {availableNodes.map(nodeId => (
                  <option key={nodeId} value={nodeId} />
               ))}
             </datalist>
          </div>

          <div className="form-group" style={{marginTop: '1rem'}}>
             <label>Select Drive ID (SSD)</label>
             <input 
               type="text" 
               list="connected-drives" 
               className="form-control" 
               placeholder="-- Select or Type SSD ID --" 
               value={targetDrive || ''} 
               onChange={e => { setTargetDrive(e.target.value); setTelemetryStatus(null); }} 
               autoComplete="off"
             />
             <datalist id="connected-drives">
               {availableDrives.map(driveId => (
                  <option key={driveId} value={driveId} />
               ))}
             </datalist>
          </div>
          
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <h2>Telemetry Tuning</h2>
            <div className="form-group" style={{marginTop: '1rem'}}>
               <label>Telemetry Interval</label>
               <select className="form-control" value={config.collectionInterval} onChange={e => setConfig({collectionInterval: parseInt(e.target.value)})}>
                 <option value="1">Every 1 Hour (High Fidelity)</option>
                 <option value="6">Every 6 Hours</option>
                 <option value="12">Every 12 Hours</option>
                 <option value="24">Every 24 Hours (Low Overhead)</option>
               </select>
            </div>

            <div className="form-group" style={{marginTop: '1rem'}}>
               <label>Total Duration (Lookback)</label>
               <select className="form-control" value={config.analysisPeriod} onChange={e => { setConfig({analysisPeriod: parseInt(e.target.value)}); setTelemetryStatus(null); }}>
                 <option value="1">Past 1 Day</option>
                 <option value="7">Past 7 Days</option>
                 <option value="14">Past 14 Days</option>
                 <option value="30">Past 30 Days</option>
                 <option value="90">Past 90 Days</option>
               </select>
            </div>
            
            <div style={{marginTop: '1.5rem'}}>
               <button className="btn-run" style={{background: '#374151', color: 'white', marginBottom: '0.5rem'}} onClick={handleCheckTelemetry} disabled={loading || !targetNode || !targetDrive}>Check Telemetry DB</button>
               
               {telemetryStatus !== null && (
                 <div className="animate-in" style={{padding: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderLeft: '3px solid #10b981', borderRadius: '2px', fontSize: '0.8rem'}}>
                   <div style={{fontWeight: 'bold', color: '#065f46', marginBottom: '4px'}}>[OK] Live Source Verified</div>
                   <div style={{color: '#064e3b'}}>Aggregated <span style={{fontWeight: 'bold'}}>{telemetryStatus}</span> multi-dimensional snapshots for LSTM Pipeline. Features: WAF, Host Writes, Temp.</div>
                 </div>
               )}
            </div>
          </div>

          <button className="btn-run" onClick={handleSimulate} disabled={loading || telemetryStatus === null || !targetNode || !targetDrive} style={{marginTop: '1.5rem'}}>{loading ? "Executing Pipeline..." : "Run ML Prediction"}</button>
        </aside>
        )}

        <main className="doc-main">
          {(activeTab === 'simulator' || activeTab === 'predictor') ? <SingleNodeView t={t} /> : <ClusterView t={t} />}
        </main>
      </div>
    </div>
  );
}

export default App;
