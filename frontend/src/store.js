import { create } from 'zustand';

const useAppStore = create((set) => ({
  mode: 'PreFlight', // 'PreFlight' or 'LiveOps'
  setMode: (newMode) => set({ mode: newMode }),

  config: {
    modelName: '',
    driveType: 'QLC',
    capacityGB: 4000,
    dailyWritesGB: 2000,
    randomSequentialRatio: 80,
    cacheSizeGB: 100,
    observed_waf: 2.1,
    observed_hit_ratio: 0.45
  },
  setConfig: (updates) => set((state) => ({ config: { ...state.config, ...updates } })),

  results: null,
  setResults: (newResults) => set({ results: newResults }),

  loading: false,
  setLoading: (isLoading) => set({ loading: isLoading })
}));

export default useAppStore;
