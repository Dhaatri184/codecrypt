import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 second default timeout
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('codecrypt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('codecrypt_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// Exorcism API
export const exorcismApi = {
  exorciseIssue: async (issueId: string) => {
    const response = await apiClient.post(`/issues/${issueId}/exorcise`);
    return response.data;
  },

  getExorcismStatus: async (exorcismId: string) => {
    const response = await apiClient.get(`/exorcisms/${exorcismId}`);
    return response.data;
  },

  getExorcismByIssue: async (issueId: string) => {
    const response = await apiClient.get(`/issues/${issueId}/exorcism`);
    return response.data;
  },
};

// Scan API
export const scanApi = {
  cancelScan: async (scanId: string) => {
    const response = await apiClient.post(`/scans/${scanId}/cancel`);
    return response.data;
  },

  getScanProgress: async (scanId: string) => {
    const response = await apiClient.get(`/scans/${scanId}`);
    return response.data;
  },
};
