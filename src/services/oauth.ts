const OAUTH_QUERY_PARAMS = ['code', 'state', 'error', 'error_description'] as const

const buildRedirectUri = (override?: string): string => {
  if (override) return override

  const url = new URL(window.location.href)
  OAUTH_QUERY_PARAMS.forEach((param) => url.searchParams.delete(param))
  return url.toString()
}

export const oauth = ({
  domain,
  cognitoRegion,
  userPoolId,
  clientId,
  redirectUri,
}: {
  domain: string
  cognitoRegion: string
  userPoolId: string
  clientId: string
  redirectUri?: string
}) => {
  const config = {
    domain,
    region: cognitoRegion,
    userPoolId,
    clientId,
    redirectUri: buildRedirectUri(redirectUri),
  }
  const generateRandomString = (length: number): string => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
    const values = new Uint8Array(length)
    crypto.getRandomValues(values)
    return Array.from(values)
      .map((v) => charset[v % charset.length])
      .join('')
  }
  const generateCodeChallenge = async (codeVerifier: string): Promise<string> => {
    const encoder = new TextEncoder()
    const data = encoder.encode(codeVerifier)
    const hash = await crypto.subtle.digest('SHA-256', data)

    // Convert to base64url
    const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)))
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  }
  const setupPKCE = async (): Promise<{ codeVerifier: string; codeChallenge: string }> => {
    const codeVerifier = generateRandomString(128)
    const codeChallenge = await generateCodeChallenge(codeVerifier)

    // Store code verifier in sessionStorage for later use in callback
    sessionStorage.setItem('pkce_code_verifier', codeVerifier)

    return { codeVerifier, codeChallenge }
  }
  const generateState = (): string => {
    const state = generateRandomString(32)
    sessionStorage.setItem('oauth_state', state)
    return state
  }
  const buildGoogleAuthUrl = async (): Promise<string> => {
    const { codeChallenge } = await setupPKCE()
    const state = generateState()

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      identity_provider: 'Google',
      scope: 'openid email profile',
      state: state,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      prompt: 'select_account',
    })

    return `${config.domain}/oauth2/authorize?${params.toString()}`
  }
  const redirectToGoogleAuth = async (): Promise<void> => {
    const authUrl = await buildGoogleAuthUrl()
    window.location.href = authUrl
  }
  const buildAppleAuthUrl = async (): Promise<string> => {
    const { codeChallenge } = await setupPKCE()
    const state = generateState()

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      identity_provider: 'SignInWithApple',
      scope: 'openid email profile',
      state: state,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
    })

    return `${config.domain}/oauth2/authorize?${params.toString()}`
  }

  const redirectToAppleAuth = async (): Promise<void> => {
    const authUrl = await buildAppleAuthUrl()
    window.location.href = authUrl
  }

  const validateState = (receivedState: string): boolean => {
    const storedState = sessionStorage.getItem('oauth_state')
    sessionStorage.removeItem('oauth_state')
    return storedState === receivedState
  }

  const getCodeVerifier = (): string | null => {
    const codeVerifier = sessionStorage.getItem('pkce_code_verifier')
    sessionStorage.removeItem('pkce_code_verifier')
    return codeVerifier
  }

  const exchangeCodeForTokens = async (code: string): Promise<{
    access_token: string
    id_token: string
    refresh_token: string
    token_type: string
    expires_in: number
  }> => {
    const codeVerifier = getCodeVerifier()

    if (!codeVerifier) {
      throw new Error('PKCE code verifier not found. Please restart the authentication flow.')
    }

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      code: code,
      redirect_uri: config.redirectUri,
      code_verifier: codeVerifier,
    })

    const response = await fetch(`${config.domain}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Token exchange failed: ${errorText}`)
    }

    return response.json()
  }

  return {
    redirectToGoogleAuth,
    redirectToAppleAuth,
    validateState,
    getCodeVerifier,
    exchangeCodeForTokens,
  }
}
