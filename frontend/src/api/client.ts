import axios, { AxiosError } from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.toString() ?? 'http://localhost:3000/api'

let refreshPromise: Promise<string> | null = null

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    const originalUrl = originalRequest?.url ?? ''

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalUrl.includes('/auth/login') &&
      !originalUrl.includes('/auth/register')
    ) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        refreshPromise ??= axios
          .post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
          .then(({ data }) => {
            const payload = (data as { data?: { accessToken: string; refreshToken: string } }).data
            if (!payload) throw new Error('Invalid refresh payload')
            const { accessToken, refreshToken: newRefreshToken } = payload
            localStorage.setItem('accessToken', accessToken)
            localStorage.setItem('refreshToken', newRefreshToken)
            return accessToken
          })
          .finally(() => {
            refreshPromise = null
          })

        const accessToken = await refreshPromise

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
        }

        return apiClient(originalRequest)
      } catch (refreshError) {
        // Refresh failed, clear session and surface the error
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.dispatchEvent(new Event('auth:logout'))
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
