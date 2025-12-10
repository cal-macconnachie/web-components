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

export const createApiClient = ({ baseUrl }: ApiClientConfig): AxiosInstance => {
  const client = axios.create({
    baseURL: baseUrl,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true, // Send HttpOnly cookies with every request
  })

  // Response interceptor - handle 401 errors
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      // If error is 401, dispatch auth failure event
      if (error.response?.status === 401) {
        log('Authentication failed (401)')

        // Dispatch custom event for auth failure
        window.dispatchEvent(
          new CustomEvent('auth-refresh-failed', {
            bubbles: true,
            composed: true,
            detail: {
              error: 'Authentication failed'
            }
          })
        )

        return Promise.reject(new AuthRefreshError('Authentication failed'))
      }

      return Promise.reject(error)
    }
  )

  return client
}

// Export a default instance creator for convenience
export const apiClient = createApiClient
