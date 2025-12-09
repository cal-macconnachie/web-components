interface CookieOptions {
  maxAge?: number // in seconds
  path?: string
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  domain?: string
}

const TOKEN_COOKIE_NAMES = {
  AUTH_TOKEN: 'authToken',
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
} as const

const AUTH_TOKEN_OPTIONS: CookieOptions = {
  maxAge: 60 * 60 * 24 * 7, // 7 days
  secure: true,
  sameSite: 'lax',
  path: '/',
}

export const cookies = () => {
  const setCookie = (name: string, value: string, options: CookieOptions = {}, rootDomain: boolean = false): void => {
    const {
      maxAge,
      path = '/',
      secure = window.location.protocol === 'https:',
      sameSite = 'lax',
      domain,
    } = options

    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`

    if (maxAge !== undefined) {
      cookieString += `; Max-Age=${maxAge}`
    }

    cookieString += `; Path=${path}`

    if (secure) {
      cookieString += '; Secure'
    }

    cookieString += `; SameSite=${sameSite}`

    if (domain) {
      if (rootDomain) {
        const hostParts = domain.split('.')
        if (hostParts.length > 2) {
          const rootDomainParts = hostParts.slice(-2)
          cookieString += `; Domain=.${rootDomainParts.join('.')}`
        } else {
          cookieString += `; Domain=.${domain}`
        }
      } else {
        cookieString += `; Domain=${domain}`
      }
    }

    document.cookie = cookieString
  }
  const getCookie = (name: string): string | null => {
    const nameEQ = encodeURIComponent(name) + '='
    const cookies = document.cookie.split(';')

    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i]
      while (cookie.charAt(0) === ' ') {
        cookie = cookie.substring(1)
      }
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length))
      }
    }

    return null
  }


  const removeCookie = (name: string, options: Pick<CookieOptions, 'path' | 'domain'> = {}, rootDomain: boolean = false): void => {
    setCookie(name, '', {
      ...options,
      maxAge: -1,
    }, rootDomain)
  }

  const hasCookie = (name: string): boolean => {
    return getCookie(name) !== null
  }
  const setAuthToken = (name: keyof typeof TOKEN_COOKIE_NAMES, value: string): void => {
    setCookie(TOKEN_COOKIE_NAMES[name], value, {
      ...AUTH_TOKEN_OPTIONS,
      domain: window.location.hostname,
    }, true)
  }

  /**
   * Get an auth token from cookies
   */
  const getAuthToken = (name: keyof typeof TOKEN_COOKIE_NAMES): string | null => {
    return getCookie(TOKEN_COOKIE_NAMES[name])
  }

  /**
   * Remove an auth token cookie
   */
  const removeAuthToken = (name: keyof typeof TOKEN_COOKIE_NAMES): void => {
    removeCookie(TOKEN_COOKIE_NAMES[name], {
      path: '/',
      domain: window.location.hostname,
    }, true)
  }

  /**
   * Clear all auth tokens
   */
  const clearAllAuthTokens = (): void => {
    removeAuthToken('AUTH_TOKEN')
    removeAuthToken('ACCESS_TOKEN')
    removeAuthToken('REFRESH_TOKEN')
  }
  return {
    setCookie,
    getCookie,
    removeCookie,
    hasCookie,
    setAuthToken,
    getAuthToken,
    removeAuthToken,
    clearAllAuthTokens,
  }
}