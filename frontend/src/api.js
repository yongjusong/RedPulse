// Centralized configuration for the API
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8085";

export const API_URLS = {
  STATS: `${API_BASE}/api/v1/cluster/stats`,
  TOPOLOGY: `${API_BASE}/api/v1/cluster/topology`,
  MODELS: `${API_BASE}/api/v1/models`,
  ADD_MODEL: `${API_BASE}/api/v1/models`,
  UPDATE_MODEL: (id) => `${API_BASE}/api/v1/models/${id}`,
  DELETE_MODEL: (id) => `${API_BASE}/api/v1/models/${id}`,
  SIMULATE: `${API_BASE}/simulate`,
  PREDICT_NODE: (nodeId) => `${API_BASE}/api/v1/cluster/node/${nodeId}/predict`,
  NODE_HISTORY: (nodeId) => `${API_BASE}/api/v1/cluster/node/${nodeId}/history`,
  NODE_DRIVES: (nodeId) => `${API_BASE}/api/v1/cluster/node/${nodeId}/drives`
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
