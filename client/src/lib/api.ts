import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://surl-api.hapxs.com/api/v2'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const apiKey = localStorage.getItem('apiKey')
    if (apiKey) {
      config.headers['X-API-KEY'] = apiKey
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('apiKey')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ==================== Links API ====================
export const linksApi = {
  getAll: (params?: { limit?: number; skip?: number; search?: string }) =>
    api.get('/links', { params }),
  
  create: (data: {
    target: string
    customurl?: string
    description?: string
    password?: string
    expire_in?: string
    tag_ids?: number[]
  }) => api.post('/links', data),
  
  update: (id: string, data: Partial<{
    address: string
    target: string
    description: string
    expire_in: string
  }>) => api.patch(`/links/${id}`, data),
  
  delete: (id: string) => api.delete(`/links/${id}`),
  
  getStats: (id: string) => api.get(`/links/${id}/stats`),
}

// ==================== Tags API ====================
export const tagsApi = {
  getAll: () => api.get('/tags'),
  
  create: (data: { name: string; color?: string }) =>
    api.post('/tags', data),
  
  update: (id: number, data: { name?: string; color?: string; is_active?: boolean }) =>
    api.patch(`/tags/${id}`, data),
  
  delete: (id: number) => api.delete(`/tags/${id}`),
  
  addToLink: (linkId: string, tagIds: number[]) =>
    api.post(`/tags/links/${linkId}`, { tag_ids: tagIds }),
  
  removeFromLink: (linkId: string, tagIds: number[]) =>
    api.delete(`/tags/links/${linkId}`, { data: { tag_ids: tagIds } }),
}

// ==================== QR Code API ====================
export const qrcodeApi = {
  generate: (linkId: string, params?: {
    format?: 'png' | 'svg' | 'dataurl'
    size?: number
    color?: string
    bgColor?: string
  }) => api.get(`/qrcode/${linkId}`, { params, responseType: params?.format === 'dataurl' ? 'json' : 'blob' }),
  
  generateBatch: (linkIds: string[], params?: { format?: string; size?: number }) =>
    api.post('/qrcode/batch', { link_ids: linkIds }, { params }),
}

// ==================== Stats API ====================
export const statsApi = {
  getDashboard: () => api.get('/stats/dashboard'),
  
  getVisitDetails: (linkId: string, params?: {
    limit?: number
    skip?: number
    start_date?: string
    end_date?: string
    country?: string
    browser?: string
    os?: string
    device_type?: string
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
  }) => api.get(`/stats/links/${linkId}/visits`, { params }),
  
  getHeatmap: (linkId: string, period: 'day' | 'week' | 'month' = 'week') =>
    api.get(`/stats/links/${linkId}/heatmap`, { params: { period } }),
  
  getUTMStats: (linkId: string, params?: { start_date?: string; end_date?: string }) =>
    api.get(`/stats/links/${linkId}/utm`, { params }),
  
  getRealtime: (linkId: string) =>
    api.get(`/stats/links/${linkId}/realtime`),
  
  getDeviceStats: (linkId: string, params?: { start_date?: string; end_date?: string }) =>
    api.get(`/stats/links/${linkId}/devices`, { params }),
  
  exportData: (linkId: string, format: 'csv' | 'json' = 'csv', params?: {
    start_date?: string
    end_date?: string
  }) => api.get(`/stats/links/${linkId}/export`, {
    params: { format, ...params },
    responseType: 'blob',
  }),
  
  getFunnel: (linkIds: string[], params?: { start_date?: string; end_date?: string }) =>
    api.post('/stats/funnel', { link_ids: linkIds }, { params }),
  
  getABTest: (linkIds: string[], params?: { start_date?: string; end_date?: string }) =>
    api.post('/stats/abtest', { link_ids: linkIds }, { params }),
}

// ==================== Security API ====================
export const securityApi = {
  // IP Rules
  getIPRules: (linkId: string) => api.get(`/security/links/${linkId}/ip-rules`),
  
  addIPRule: (linkId: string, data: {
    ip_address?: string
    ip_range?: string
    rule_type: 'blacklist' | 'whitelist'
    reason?: string
  }) => api.post(`/security/links/${linkId}/ip-rules`, data),
  
  updateIPRule: (id: number, data: Partial<{
    ip_address: string
    ip_range: string
    rule_type: string
    reason: string
    is_active: boolean
  }>) => api.patch(`/security/ip-rules/${id}`, data),
  
  deleteIPRule: (id: number) => api.delete(`/security/ip-rules/${id}`),
  
  // Geo Restrictions
  getGeoRestrictions: (linkId: string) =>
    api.get(`/security/links/${linkId}/geo-restrictions`),
  
  addGeoRestriction: (linkId: string, data: {
    country_code?: string
    region?: string
    city?: string
    restriction_type: 'allow' | 'block'
    redirect_url?: string
  }) => api.post(`/security/links/${linkId}/geo-restrictions`, data),
  
  deleteGeoRestriction: (id: number) =>
    api.delete(`/security/geo-restrictions/${id}`),
  
  // Rate Limits
  getRateLimits: (linkId: string) =>
    api.get(`/security/links/${linkId}/rate-limits`),
  
  addRateLimit: (linkId: string, data: {
    max_requests: number
    window_seconds: number
    action?: 'block' | 'throttle' | 'captcha'
    block_duration_minutes?: string
  }) => api.post(`/security/links/${linkId}/rate-limits`, data),
  
  deleteRateLimit: (id: number) =>
    api.delete(`/security/rate-limits/${id}`),
  
  // Redirect Rules
  getRedirectRules: (linkId: string) =>
    api.get(`/security/links/${linkId}/redirect-rules`),
  
  addRedirectRule: (linkId: string, data: {
    rule_name: string
    priority?: number
    condition_type: 'device' | 'browser' | 'os' | 'country' | 'language' | 'time' | 'referrer' | 'custom'
    condition_value: Record<string, any>
    target_url: string
    time_start?: string
    time_end?: string
    days_of_week?: string
  }) => api.post(`/security/links/${linkId}/redirect-rules`, data),
  
  updateRedirectRule: (id: number, data: Partial<{
    rule_name: string
    priority: number
    condition_value: Record<string, any>
    target_url: string
    time_start: string
    time_end: string
    days_of_week: string
    is_active: boolean
  }>) => api.patch(`/security/redirect-rules/${id}`, data),
  
  deleteRedirectRule: (id: number) =>
    api.delete(`/security/redirect-rules/${id}`),
}

// ==================== Auth API ====================
export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  
  signup: (data: { email: string; password: string }) =>
    api.post('/auth/signup', data),
  
  getUser: () => api.get('/users'),
  
  updateUser: (data: Partial<{ email: string }>) =>
    api.patch('/users', data),
}

export default api
