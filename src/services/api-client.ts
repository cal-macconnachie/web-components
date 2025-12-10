import axios, { AxiosError, AxiosInstance } from 'axios'
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

// Global refresh state on window to prevent multiple simultaneous refreshes
declare global {
  interface Window {
    __authRefreshPromise?: Promise<void> | null
  }
}

export const createApiClient = ({ baseUrl, apiBaseUrl }: ApiClientConfig): AxiosInstance => {
  const client = axios.create({
    baseURL: baseUrl,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true, // Send HttpOnly cookies with every request
  })

  // Response interceptor - handle 401 errors with automatic token refresh
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config

      // If error is 401 and we haven't already tried refreshing for this request
      if (error.response?.status === 401 && originalRequest && !originalRequest.headers['X-Retry-After-Refresh']) {
        log('Authentication failed (401), attempting token refresh...')

        // If we're already refreshing, wait for that to complete
        if (window.__authRefreshPromise) {
          try {
            await window.__authRefreshPromise
            // Refresh succeeded, retry original request
            originalRequest.headers['X-Retry-After-Refresh'] = 'true'
            return client.request(originalRequest)
          } catch {
            // Refresh failed, fall through to error handling
          }
        }

        // Start refresh process if not already started
        if (!window.__authRefreshPromise) {
          window.__authRefreshPromise = (async () => {
            try {
              const refreshUrl = apiBaseUrl ? `${apiBaseUrl}/auth/refresh` : `${baseUrl}/auth/refresh`
              const response = await fetch(refreshUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
              })

              if (!response.ok) {
                throw new Error('Refresh failed')
              }

              log('Token refresh successful')
            } catch (refreshError) {
              log('Token refresh failed:', refreshError)
              throw refreshError
            } finally {
              window.__authRefreshPromise = null
            }
          })()

          try {
            await window.__authRefreshPromise
            // Refresh succeeded, retry original request
            originalRequest.headers['X-Retry-After-Refresh'] = 'true'
            return client.request(originalRequest)
          } catch (refreshError) {
            // Refresh failed, dispatch event and throw
            log('Token refresh failed, user needs to re-authenticate')

            window.dispatchEvent(
              new CustomEvent('auth-refresh-failed', {
                bubbles: true,
                composed: true,
                detail: {
                  error: 'Authentication refresh failed'
                }
              })
            )

            return Promise.reject(new AuthRefreshError('Authentication refresh failed'))
          }
        }
      }

      return Promise.reject(error)
    }
  )

  return client
}

// Export a default instance creator for convenience
export const apiClient = createApiClient
