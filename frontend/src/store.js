import { create } from 'zustand';

const useAppStore = create((set) => ({
  mode: 'Design',
  setMode: (newMode) => set({ mode: newMode }),
  
  activeTab: 'simulator', // 'simulator', 'predictor', 'cluster', 'impact'
  setTab: (newTab) => set({ activeTab: newTab }),

  targetNode: null,
  setTargetNode: (nodeId) => set({ targetNode: nodeId }),
  
  targetDrive: null,
  setTargetDrive: (driveId) => set({ targetDrive: driveId }),

  config: {
    driveType: 'TLC',
    capacityGB: 3840,
    dailyWritesGB: 2000,
    randomSequentialRatio: 80,
    cacheSizeGB: 100,
    observed_hit_ratio: 0.45,
    observed_waf: 2.1,
    analysisPeriod: 30, // Collection Duration (Lookback in days)
    collectionInterval: 24, // Collection Interval (in hours)
    customTBW: 1000
  },
  setConfig: (updates) => set((state) => ({ config: { ...state.config, ...updates } })),

  results: null,
  setResults: (newResults) => set({ results: newResults }),

  loading: false,
  setLoading: (val) => set({ loading: val }),

  mlProgress: 'IDLE', // 'IDLE', 'COLLECTING', 'PREPROCESSING', 'INFERENCING', 'DONE'
  setMlProgress: (val) => set({ mlProgress: val }),

  telemetryStatus: null, // Holds retrieved count object
  setTelemetryStatus: (val) => set({ telemetryStatus: val }),

  jumpToPredictor: (nodeId) => set({
    activeTab: 'predictor',
    mode: 'Predictor',
    targetNode: nodeId,
    targetDrive: null,
    telemetryStatus: null
  })
}));

export default useAppStore;
