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

  // Track if we've determined there are no refresh tokens available
  let hasNoRefreshToken = false

  // Response interceptor - handle 401 errors with automatic token refresh
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config

      // Only attempt refresh for 401 errors on requests that haven't been retried yet
      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest.headers['X-Retry-After-Refresh']
      ) {
        log('Authentication failed (401), attempting token refresh...')

        // If we already know there's no refresh token, don't try again
        if (hasNoRefreshToken) {
          log('No refresh token available (previously determined), skipping refresh')
          window.dispatchEvent(
            new CustomEvent('auth-refresh-failed', {
              bubbles: true,
              composed: true,
              detail: { error: 'No refresh token available' }
            })
          )
          return Promise.reject(new AuthRefreshError('No refresh token available'))
        }

        // If a refresh is already in progress, wait for it
        if (window.__authRefreshPromise) {
          log('Refresh already in progress, waiting for completion...')
          try {
            await window.__authRefreshPromise
            log('Refresh completed successfully, retrying original request')
            originalRequest.headers['X-Retry-After-Refresh'] = 'true'
            return client.request(originalRequest)
          } catch (refreshError) {
            log('Refresh failed while waiting, rejecting request')
            return Promise.reject(new AuthRefreshError('Authentication refresh failed'))
          }
        }

        // Start a new refresh (only one will execute due to the check above)
        log('Starting new refresh token request...')
        window.__authRefreshPromise = (async () => {
          try {
            const refreshUrl = apiBaseUrl ? `${apiBaseUrl}/auth/refresh` : `${baseUrl}/auth/refresh`
            log(`Calling refresh endpoint: ${refreshUrl}`)

            const response = await fetch(refreshUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
            })

            log(`Refresh response status: ${response.status}`)

            // Log all response headers for investigation
            const headers: Record<string, string> = {}
            response.headers.forEach((value, key) => {
              headers[key] = value
            })
            log('Refresh response headers:', headers)

            // Check if Set-Cookie headers are present (they won't be visible in JS for security)
            // But we can check for the presence of other headers to verify the response is correct
            const hasContentType = response.headers.get('content-type')
            log(`Response has content-type: ${hasContentType}`)

            if (response.status === 400) {
              // 400 means no refresh token present in cookies
              log('Refresh returned 400 - no refresh token in cookies, marking as unavailable')
              hasNoRefreshToken = true
              const errorBody = await response.text()
              log('400 response body:', errorBody)
              throw new Error('No refresh token available')
            }

            if (!response.ok) {
              const errorBody = await response.text()
              log(`Refresh failed with status ${response.status}, body:`, errorBody)
              throw new Error(`Refresh failed with status ${response.status}`)
            }

            // Success - log the response body
            const responseBody = await response.text()
            log('Refresh succeeded, response body:', responseBody)
            log('Cookies should now be updated by the browser automatically')
          } catch (refreshError) {
            log('Token refresh error:', refreshError)
            throw refreshError
          } finally {
            log('Clearing refresh promise')
            window.__authRefreshPromise = null
          }
        })()

        try {
          await window.__authRefreshPromise
          log('Refresh succeeded, retrying original request with updated cookies')
          originalRequest.headers['X-Retry-After-Refresh'] = 'true'
          return client.request(originalRequest)
        } catch (refreshError) {
          log('Token refresh failed, user needs to re-authenticate')

          window.dispatchEvent(
            new CustomEvent('auth-refresh-failed', {
              bubbles: true,
              composed: true,
              detail: {
                error: refreshError instanceof Error ? refreshError.message : 'Authentication refresh failed'
              }
            })
          )

          return Promise.reject(new AuthRefreshError('Authentication refresh failed'))
        }
      }

      return Promise.reject(error)
    }
  )

  return client
}

// Export a default instance creator for convenience
export const apiClient = createApiClient
