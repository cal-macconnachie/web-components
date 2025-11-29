import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import { cookies as cookiesService } from './cookies'
import { api } from './api'
import { log } from './logger'

export class AuthRefreshError extends Error {
  constructor(message: string = 'Authentication refresh failed') {
    super(message)
    this.name = 'AuthRefreshError'
  }
}

interface ApiClientConfig {
  baseUrl: string
  apiBaseUrl?: string
}

export const createApiClient = ({ baseUrl, apiBaseUrl }: ApiClientConfig): AxiosInstance => {
  const cookies = cookiesService()
  const authApiBaseUrl = apiBaseUrl || baseUrl

  const client = axios.create({
    baseURL: baseUrl,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  let isRefreshing = false
  let refreshPromise: Promise<string> | null = null

  // Request interceptor - attach auth header
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const authToken = cookies.getAuthToken('AUTH_TOKEN')
      if (authToken && config.headers) {
        config.headers.Authorization = `Bearer ${authToken}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor - handle 401 and refresh
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

      // If error is 401 and we haven't retried yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true

        try {
          // If already refreshing, wait for that refresh to complete
          if (isRefreshing && refreshPromise) {
            const newAuthToken = await refreshPromise
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAuthToken}`
            }
            return client(originalRequest)
          }

          // Start refreshing
          isRefreshing = true
          refreshPromise = (async () => {
            try {
              const refreshToken = cookies.getAuthToken('REFRESH_TOKEN')
              const accessToken = cookies.getAuthToken('ACCESS_TOKEN')
              const oldIdToken = cookies.getAuthToken('AUTH_TOKEN')

              if (!refreshToken || !accessToken || !oldIdToken) {
                log('Missing tokens for refresh, clearing all')
                cookies.clearAllAuthTokens()
                throw new AuthRefreshError('No refresh token available')
              }

              log('Attempting to refresh tokens...')
              const authApi = api({ baseUrl: authApiBaseUrl })
              const {
                accessToken: newAccessToken,
                idToken: newIdToken,
                refreshToken: newRefreshToken,
              } = await authApi.refresh({ refreshToken })

              // Update cookies with new tokens
              cookies.setAuthToken('ACCESS_TOKEN', newAccessToken)
              cookies.setAuthToken('AUTH_TOKEN', newIdToken)
              cookies.setAuthToken('REFRESH_TOKEN', newRefreshToken ?? refreshToken)

              log('Token refresh successful')
              return newIdToken
            } catch (err) {
              log('Token refresh failed:', err)
              cookies.clearAllAuthTokens()
              throw new AuthRefreshError(
                (err as Error).message || 'Failed to refresh authentication'
              )
            } finally {
              isRefreshing = false
              refreshPromise = null
            }
          })()

          const newAuthToken = await refreshPromise

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAuthToken}`
          }
          return client(originalRequest)
        } catch (refreshError) {
          // If refresh failed, reject with AuthRefreshError
          return Promise.reject(refreshError)
        }
      }

      return Promise.reject(error)
    }
  )

  return client
}

// Export a default instance creator for convenience
export const apiClient = createApiClient
