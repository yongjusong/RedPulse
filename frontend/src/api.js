// Centralized configuration for the API
const API_BASE = "http://localhost:8085";

export const API_URLS = {
  STATS: `${API_BASE}/api/v1/cluster/stats`,
  TOPOLOGY: `${API_BASE}/api/v1/cluster/topology`,
  ECONOMICS: `${API_BASE}/api/v1/economics/summary`,
  MODELS: `${API_BASE}/api/v1/models`,
  SIMULATE: `${API_BASE}/simulate`,
  PREDICT_NODE: (nodeId) => `${API_BASE}/api/v1/cluster/node/${nodeId}/predict`,
  NODE_HISTORY: (nodeId) => `${API_BASE}/api/v1/cluster/node/${nodeId}/history`
};

export const fetchApi = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    throw error;
  }
};

export const getSeverityColor = (severity) => {
  if (severity === 2) return '#dc2626'; // Critical Red
  if (severity === 1) return '#d97706'; // Warning Orange
  return '#16a34a'; // Healthy Green
};

export const getSeverityLabel = (severity) => {
  if (severity === 2) return 'CRITICAL';
  if (severity === 1) return 'WARNING';
  return 'HEALTHY';
};
