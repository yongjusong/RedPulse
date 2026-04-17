import { create } from 'zustand';

const useAppStore = create((set) => ({
  mode: 'Design',
  setMode: (newMode) => set({ mode: newMode }),
  
  activeTab: 'single', // 'single' (Simulator), 'cluster' (Grid), 'impact' (Economics)
  setTab: (newTab) => set({ activeTab: newTab }),

  config: {
    driveType: 'TLC',
    capacityGB: 3840,
    dailyWritesGB: 2000,
    randomSequentialRatio: 80,
    cacheSizeGB: 100,
    observed_hit_ratio: 0.45,
    observed_waf: 2.1,
    analysisPeriod: 30,
    customTBW: 1000
  },
  setConfig: (updates) => set((state) => ({ config: { ...state.config, ...updates } })),

  results: null,
  setResults: (newResults) => set({ results: newResults }),

  loading: false,
  setLoading: (val) => set({ loading: val }),

  jumpToLiveOps: (nodeId, diskInfo) => set((state) => ({
    activeTab: 'single',
    mode: 'Predictor',
    config: {
      ...state.config,
      observed_waf: diskInfo.waf || 2.1,
      observed_hit_ratio: 0.5, // Mock
      capacityGB: 3840, // Assume standard or detectable
    }
  }))
}));

export default useAppStore;
