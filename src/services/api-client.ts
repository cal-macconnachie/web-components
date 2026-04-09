import axios, { AxiosError, AxiosInstance } from 'axios'
import { registerBaseToast, showToast } from '../components/base-toast'
import { log } from './logger'
registerBaseToast()

export class AuthRefreshError extends Error {
  constructor(message: string = 'Authentication refresh failed') {
    super(message)
    this.name = 'AuthRefreshError'
  }
}

interface ApiClientConfig {
  baseUrl: string
  useToasts?: boolean
}

// Global refresh state on window to prevent multiple simultaneous refreshes
declare global {
  interface Window {
    __authRefreshPromise?: Promise<void> | null
  }
}

export const createApiClient = ({ baseUrl, useToasts = true }: ApiClientConfig): AxiosInstance => {
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

      // Handle rate limiting (429) - show user-friendly toast
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after']
        let message = 'Too many requests. Please try again later.'

        if (retryAfter) {
          // retry-after can be in seconds or a date
          const retryAfterNum = parseInt(retryAfter, 10)
          if (!isNaN(retryAfterNum)) {
            // It's a number of seconds
            if (retryAfterNum < 60) {
              message = `Too many requests. Please try again in ${retryAfterNum} seconds.`
            } else {
              const minutes = Math.ceil(retryAfterNum / 60)
              message = `Too many requests. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`
            }
          } else {
            // It's a date string
            try {
              const retryDate = new Date(retryAfter)
              const now = new Date()
              const diffMs = retryDate.getTime() - now.getTime()
              const diffSecs = Math.ceil(diffMs / 1000)

              if (diffSecs > 0 && diffSecs < 60) {
                message = `Too many requests. Please try again in ${diffSecs} seconds.`
              } else if (diffSecs >= 60) {
                const minutes = Math.ceil(diffSecs / 60)
                message = `Too many requests. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`
              }
            } catch (e) {
              // Invalid date, use default message
            }
          }
        }

        log('Rate limited (429):', message)
        if (useToasts) {
          showToast({
            message,
            variant: 'warning',
          })
        }

        return Promise.reject(error)
      }

      // Handle other server errors (5xx) with user-friendly messages
      if (error.response?.status && error.response.status >= 500) {
        log(`Server error (${error.response.status})`)
        if (useToasts) {
          showToast({
            message: 'Server error. Please try again later.',
            variant: 'danger',
          })
        }

        return Promise.reject(error)
      }

      // Only attempt refresh for 401 errors on requests that haven't been retried yet
      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest.headers['X-Retry-After-Refresh']
      ) {
        log('Authentication failed (401), attempting token refresh...')

        // If we already know there's no refresh token, don't try again.
        // Silently reject — no toast or event since there was never a session.
        if (hasNoRefreshToken) {
          log('No refresh token available (previously determined), skipping refresh')
          return Promise.reject(new AuthRefreshError('No refresh token available'))
        }

        // Atomic check-and-set: if no refresh in progress, start one synchronously
        // This prevents race conditions where multiple 401s start multiple refreshes
        if (!window.__authRefreshPromise) {
          log('Starting new refresh token request (no refresh in progress)...')

          window.__authRefreshPromise = (async () => {
            try {
              // Always use same-origin auth endpoints (application must provide /api/auth/refresh proxy)
              // Normalize baseUrl to avoid double slashes
              const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
              const refreshUrl = `${normalizedBase}/api/auth/refresh`.replace(/\/api\/api\//, '/api/')
              
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
        } else {
          log('Refresh already in progress, waiting for completion...')
        }

        // Wait for the refresh (whether we just started it or someone else did)
        try {
          await window.__authRefreshPromise
          log('Refresh completed successfully, retrying original request with updated cookies')
          // Give browser time to process Set-Cookie headers from refresh response
          await new Promise(resolve => setTimeout(resolve, 100))
          originalRequest.headers['X-Retry-After-Refresh'] = 'true'
          return client.request(originalRequest)
        } catch (refreshError) {
          log('Token refresh failed, user needs to re-authenticate')
          // Only show "session expired" toast if a refresh token actually existed
          // (i.e. the user had a session). If there was no refresh token, the user
          // was never logged in, so the message is misleading.
          if (useToasts && !hasNoRefreshToken) {
            showToast({
              message: 'Session expired. Please log in again.',
              variant: 'danger',
            })
          }

          // Only dispatch auth-refresh-failed if there was an actual session.
          // If no refresh token existed, the user was never logged in (e.g. during
          // OAuth callback or initial page load) — silently reject instead.
          if (!hasNoRefreshToken) {
            window.dispatchEvent(
              new CustomEvent('auth-refresh-failed', {
                bubbles: true,
                composed: true,
                detail: {
                  error: refreshError instanceof Error ? refreshError.message : 'Authentication refresh failed'
                }
              })
            )
          }

          return Promise.reject(new AuthRefreshError(
            hasNoRefreshToken ? 'No refresh token available' : 'Authentication refresh failed'
          ))
        }
      }

      // Handle network errors (no response from server)
      if (!error.response) {
        log('Network error - no response from server')
        if (useToasts) {
          showToast({
            message: 'Network error. Please check your connection and try again.',
            variant: 'danger',
          })
        }

        return Promise.reject(error)
      }

      // For other errors (4xx except 401 and 429), we'll let the application handle them
      // But log them for debugging
      if (error.response?.status) {
        log(`Request failed with status ${error.response.status}`)
      }

      return Promise.reject(error)
    }
  )

  return client
}
