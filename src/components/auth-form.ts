import { html, nothing, PropertyValues } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import { repeat } from 'lit/directives/repeat.js'
import { BaseElement } from '../base-element'
import { api } from '../services/api'
import { log } from '../services/logger'
import { oauth } from '../services/oauth'
import { appStyles } from '../services/styles'
import { BaseInput } from './base-input'

type AuthMode = 'signin' | 'signup'
type ResetStep = 'none' | 'request' | 'confirm'
type SignupStep = 'form' | 'otp'

interface SignInDetail {
  email: string
  password: string
}

interface SignUpDetail {
  email: string
  password: string
  givenName: string
  familyName: string
  code: string
}

interface ResetRequestDetail {
  email: string
}

interface ResetConfirmDetail {
  email: string
  newPassword: string
  otp: string
}

const OAUTH_QUERY_PARAMS = [
  'code',
  'state',
  'error',
  'error_description',
  'access_token',
  'id_token',
  'refresh_token',
  'token_type',
  'expires_in',
] as const

@customElement('auth-form')
export class AuthForm extends BaseElement {
  // Main properties
  @property({ type: String, attribute: 'initial-mode' }) initialMode: AuthMode = 'signin'
  @property({ type: String, attribute: 'logo-url' }) logoUrl = ''
  @property({ type: String, attribute: 'api-domain' }) baseUrl = ''
  @property({ type: String, attribute: 'oauth-domain' }) oauthDomain = ''
  @property({ type: String, attribute: 'oauth-region' }) oauthRegion = ''
  @property({ type: String, attribute: 'oauth-user-pool-id' }) oauthUserPoolId = ''
  @property({ type: String, attribute: 'oauth-client-id' }) oauthClientId = ''
  @property({ type: String, attribute: 'oauth-redirect-uri' }) oauthRedirectUri = ''
  @property({ type: String, attribute: 'oauth-spa-domain' }) oauthSpaDomain = ''
  @property({ type: Boolean, attribute: 'disable-signup' }) disableSignup = false

  // State
  @state() private mode: AuthMode = 'signin'
  @state() private resetStep: ResetStep = 'none'
  @state() private signupStep: SignupStep = 'form'
  @state() private isLoading = false
  @state() private isLoggedIn = false
  @state() private email = ''
  @state() private password = ''
  @state() private givenName = ''
  @state() private familyName = ''
  @state() private newPassword = ''
  @state() private confirmPassword = ''
  @state() private notice = ''
  @state() private error = ''
  @state() private errors: Record<string, string> = {}
  @state() private userEmail: string | null = null

  // OTP state
  @state() private otpDigits: string[] = ['', '', '', '', '', '']
  @state() private signupOtpDigits: string[] = ['', '', '', '', '', '']

  private apiService?: ReturnType<typeof api>
  private oauthService?: ReturnType<typeof oauth>

  // Refs
  @query('#email-input') private emailInput?: BaseInput

  private hasHandledOAuthCallback = false

  private readonly baseUrlErrorMessage =
    'Authentication service is not configured correctly. Please add an API domain or contact support.'

  private hasApiBaseUrl() {
    return this.baseUrl.trim().length > 0
  }

  private getNormalizedBaseUrl() {
    const trimmed = this.baseUrl.trim()
    if (!trimmed) return ''

    // Add https:// if not present
    const withHttps = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`

    // Ensure trailing slash
    const normalized = withHttps.endsWith('/') ? withHttps : `${withHttps}/`

    return normalized
  }

  private getApiService() {
    if (!this.hasApiBaseUrl()) {
      throw new Error('API domain is not set')
    }

    if (!this.apiService) {
      this.apiService = api({
        baseUrl: this.getNormalizedBaseUrl(),
      })
    }

    return this.apiService
  }

  connectedCallback() {
    super.connectedCallback()
    // Cannot check HttpOnly cookies from JavaScript
    // Login state will be determined by successful API responses
    this.isLoggedIn = false
    this.mode = this.disableSignup && this.initialMode === 'signup' ? 'signin' : this.initialMode
    if (!this.hasApiBaseUrl()) {
      log('Warning: API domain is not set. Please set the "api-domain" attribute to the correct API base URL.')
      this.error = this.baseUrlErrorMessage
    }
    void this.handleOAuthCallbackIfPresent()
  }

  firstUpdated() {
    // Focus email input after component is rendered
    setTimeout(() => {
      this.emailInput?.focus()
    }, 100)
  }

  updated(changed: PropertyValues) {
    if (changed.has('disableSignup')) {
      if (this.disableSignup && this.mode === 'signup') {
        this.mode = 'signin'
        this.signupStep = 'form'
      }
    }

    if (changed.has('baseUrl')) {
      this.apiService = undefined
      if (!this.hasApiBaseUrl()) {
        this.error = this.baseUrlErrorMessage
      } else {
        if (this.error === this.baseUrlErrorMessage) {
          this.error = ''
        }
        if (!this.hasHandledOAuthCallback) {
          void this.handleOAuthCallbackIfPresent()
        }
      }
    }

    if (
      changed.has('oauthDomain') ||
      changed.has('oauthRegion') ||
      changed.has('oauthUserPoolId') ||
      changed.has('oauthClientId') ||
      changed.has('oauthRedirectUri')
    ) {
      this.oauthService = undefined
      void this.handleOAuthCallbackIfPresent()
    }
  }

  private resetState() {
    this.error = ''
    this.notice = ''
    this.errors = {}
    this.email = ''
    this.password = ''
    this.givenName = ''
    this.familyName = ''
    this.newPassword = ''
    this.confirmPassword = ''
    this.otpDigits = ['', '', '', '', '', '']
    this.signupOtpDigits = ['', '', '', '', '', '']
    this.resetStep = 'none'
    this.signupStep = 'form'
    this.mode = this.initialMode
  }

  private toggleMode() {
    if (this.resetStep !== 'none') return
    if (this.disableSignup && this.mode === 'signin') return
    this.mode = this.mode === 'signin' ? 'signup' : 'signin'
    this.signupStep = 'form'
    this.error = ''
    this.notice = ''
    this.errors = {}
    this.confirmPassword = ''
    if (this.mode === 'signin') {
      this.givenName = ''
      this.familyName = ''
      this.signupOtpDigits = ['', '', '', '', '', '']
    }
  }

  private startReset() {
    this.mode = 'signin'
    this.resetStep = 'request'
    this.error = ''
    this.notice = ''
    this.errors = {}
    this.password = ''
    this.newPassword = ''
    this.confirmPassword = ''
  }

  private cancelReset() {
    this.resetStep = 'none'
    this.error = ''
    this.notice = ''
    this.otpDigits = ['', '', '', '', '', '']
    this.errors = {}
    this.newPassword = ''
    this.confirmPassword = ''
  }

  private backToRequest() {
    this.resetStep = 'request'
    this.error = ''
    this.notice = ''
    this.otpDigits = ['', '', '', '', '', '']
    this.errors = {}
    this.newPassword = ''
    this.confirmPassword = ''
  }

  private backToSignupForm() {
    this.signupStep = 'form'
    this.error = ''
    this.notice = ''
    this.signupOtpDigits = ['', '', '', '', '', '']
    this.errors = {}
  }

  // Validation
  private validate(): boolean {
    const errors: Record<string, string> = {}

    // Email validation
    if (!this.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      errors.email = 'Enter a valid email'
    }

    // Password validation (skip for reset request and OTP steps)
    if (this.resetStep === 'none' && this.signupStep === 'form') {
      if (!this.password) {
        errors.password = 'Password is required'
      } else if (this.password.length < 8) {
        errors.password = 'Password must be at least 8 characters'
      } else if (this.mode === 'signup') {
        // Strong password check for signup
        const hasUpper = /[A-Z]/.test(this.password)
        const hasLower = /[a-z]/.test(this.password)
        const hasNumber = /[0-9]/.test(this.password)
        if (!hasUpper || !hasLower || !hasNumber) {
          errors.password = 'Password must contain uppercase, lowercase, and number'
        }
      }
    }

    // Signup fields validation
    if (this.mode === 'signup' && this.resetStep === 'none' && this.signupStep === 'form') {
      if (!this.givenName.trim()) {
        errors.givenName = 'First name is required'
      } else if (!/^[a-zA-Z\s-']+$/.test(this.givenName.trim())) {
        errors.givenName = 'Invalid first name'
      }

      if (!this.familyName.trim()) {
        errors.familyName = 'Last name is required'
      } else if (!/^[a-zA-Z\s-']+$/.test(this.familyName.trim())) {
        errors.familyName = 'Invalid last name'
      }

      if (!this.confirmPassword) {
        errors.confirm_password = 'Please confirm your password'
      } else if (this.password !== this.confirmPassword) {
        errors.confirm_password = 'Passwords must match'
      }
    }

    // OTP validation
    if (this.signupStep === 'otp') {
      const otpValue = this.signupOtpDigits.join('')
      if (otpValue.length !== 6 || !/^\d{6}$/.test(otpValue)) {
        errors.signup_otp = 'Enter the 6-digit code'
      }
    }

    // Reset confirm validation
    if (this.resetStep === 'confirm') {
      const otpValue = this.otpDigits.join('')
      if (otpValue.length !== 6 || !/^\d{6}$/.test(otpValue)) {
        errors.otp = 'Enter the 6-digit code'
      }

      if (otpValue.length === 6) {
        if (!this.newPassword) {
          errors.new_password = 'New password is required'
        } else if (this.newPassword.length < 8) {
          errors.new_password = 'Password must be at least 8 characters'
        } else {
          const hasUpper = /[A-Z]/.test(this.newPassword)
          const hasLower = /[a-z]/.test(this.newPassword)
          const hasNumber = /[0-9]/.test(this.newPassword)
          if (!hasUpper || !hasLower || !hasNumber) {
            errors.new_password = 'Password must contain uppercase, lowercase, and number'
          }
        }

        if (!this.confirmPassword) {
          errors.confirm_password = 'Please confirm your password'
        } else if (this.newPassword !== this.confirmPassword) {
          errors.confirm_password = 'Passwords must match'
        }
      }
    }

    this.errors = errors
    return Object.keys(errors).length === 0
  }

  // Form submission
  private async handleSubmit(event: Event) {
    event.preventDefault()
    this.notice = ''
    this.error = ''

    if (!this.hasApiBaseUrl()) {
      this.error = this.baseUrlErrorMessage
      return
    }

    if (!this.validate()) return

    this.isLoading = true

    try {
      const actionKey = `${this.resetStep}-${this.mode}-${this.signupStep}`

      switch (actionKey) {
        case 'request-signin-form':
          try {
            await this.handleRequestReset()
          } catch (err) {
            log('Reset request error:', err)
            this.error = 'Reset request failed. Please check your details and try again.'
          }
          break

        case 'confirm-signin-form':
          try {
            await this.handleConfirmReset()
          } catch (err) {
            log('Reset confirm error:', err)
            this.error = 'Reset confirmation failed. Please check your details and try again.'
          }
          break

        case 'none-signup-form':
          try {
            await this.handleRequestSignupOtp()
          } catch (err) {
            log('Signup error:', err)
            this.error = 'Signup failed. Please check your details and try again.'
          }
          break

        case 'none-signup-otp':
          try {
            await this.handleSignupWithOtp()
          } catch (err) {
            log('Signup error:', err)
            this.error = 'Signup failed. Please check your details and try again.'
          }
          break

        default:
          try {
            await this.handleSignIn()
          } catch (err) {
            log('Sign in error:', err)
            this.error = 'Login failed. Please check your credentials and try again.'
          }
          break
      }
    } finally {
      this.isLoading = false
    }
  }

  private handleAuthSuccess(user: {
    email: string
    given_name?: string
    family_name?: string
  }) {
    // Cookies are set by the server with HttpOnly flag
    // We just need to update local state and dispatch event
    this.isLoggedIn = true
    this.userEmail = user.email

    // Dispatch login success event
    this.dispatchEvent(
      new CustomEvent('auth-success', {
        detail: { user },
        bubbles: true,
        composed: true,
      })
    )
  }

  private async handleSignIn() {
    const detail: SignInDetail = {
      email: this.email.trim(),
      password: this.password,
    }

    const { user } = await this.getApiService().login(detail)
    this.handleAuthSuccess(user)
  }

  private isOAuthConfigured(): boolean {
    return [this.oauthDomain, this.oauthRegion, this.oauthUserPoolId, this.oauthClientId].every(
      (value) => !!value?.trim()
    )
  }

  private getOAuthService() {
    if (!this.isOAuthConfigured()) {
      return null
    }

    if (!this.oauthService) {
      const redirectUri = this.oauthRedirectUri?.trim() ? this.oauthRedirectUri.trim() : undefined
      this.oauthService = oauth({
        domain: this.oauthDomain.trim(),
        cognitoRegion: this.oauthRegion.trim(),
        userPoolId: this.oauthUserPoolId.trim(),
        clientId: this.oauthClientId.trim(),
        redirectUri,
      })
    }

    return this.oauthService
  }

  private stripOAuthParamsFromUrl() {
    const url = new URL(window.location.href)
    let changed = false

    for (const param of OAUTH_QUERY_PARAMS) {
      if (url.searchParams.has(param)) {
        url.searchParams.delete(param)
        changed = true
      }
    }

    if (changed) {
      const queryString = url.searchParams.toString()
      const newUrl = `${url.pathname}${queryString ? `?${queryString}` : ''}${url.hash}`
      window.history.replaceState({}, document.title, newUrl)
    }
  }

  private async handleOAuthCallbackIfPresent() {
    const urlParams = new URLSearchParams(window.location.search)
    const accessToken = urlParams.get('access_token')
    const idToken = urlParams.get('id_token')
    const refreshToken = urlParams.get('refresh_token')
    const code = urlParams.get('code')
    const state = urlParams.get('state')
    const error = urlParams.get('error')
    const errorDescription = urlParams.get('error_description')

    // Check if we have OAuth-related params
    const hasOAuthParams = accessToken || idToken || code || error
    if (!hasOAuthParams) {
      return
    }

    if (this.hasHandledOAuthCallback) return

    if (!this.hasApiBaseUrl()) {
      this.error = this.baseUrlErrorMessage
      log('OAuth callback received but API domain is not set.')
      return
    }

    this.hasHandledOAuthCallback = true
    this.isLoading = true
    this.error = ''

    try {
      if (error) {
        throw new Error(errorDescription || `OAuth error: ${error}`)
      }

      // NEW FLOW: If we have tokens directly in URL (from oauth-spa)
      if (accessToken && idToken && refreshToken) {
        log('OAuth tokens received from oauth-spa, logging in...')

        // Call API to exchange oauth-spa tokens - server sets HttpOnly cookies
        const { user } = await this.getApiService().login({
          accessToken: accessToken,
          refreshToken: refreshToken,
          idToken: idToken,
        })

        this.handleAuthSuccess(user)
      }
      // LEGACY FLOW: If we have authorization code (direct OAuth)
      else if (code && state) {
        if (!this.isOAuthConfigured()) {
          log('OAuth code detected but OAuth config is incomplete.')
          throw new Error('OAuth is not configured correctly. Please try again later.')
        }

        const oauthService = this.getOAuthService()
        if (!oauthService) {
          throw new Error('OAuth is not configured correctly. Please try again later.')
        }

        if (!oauthService.validateState(state)) {
          throw new Error('Invalid state parameter. Please try signing in again.')
        }

        log('Exchanging authorization code for tokens...')
        const tokens = await oauthService.exchangeCodeForTokens(code)
        const { user } = await this.getApiService().login({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          idToken: tokens.id_token,
        })

        this.handleAuthSuccess(user)
      } else {
        throw new Error('Missing required OAuth parameters')
      }
    } catch (err) {
      log('OAuth callback error:', err)
      this.error =
        (err as { message?: string }).message || 'An unexpected error occurred during authentication'
    } finally {
      this.stripOAuthParamsFromUrl()
      this.isLoading = false
    }
  }

  private async handleRequestSignupOtp() {
    // Move to OTP step
    this.signupStep = 'otp'
    this.notice = 'A 6-digit code has been sent to your email'
    this.signupOtpDigits = ['', '', '', '', '', '']
    await this.getApiService().requestRegisterOtp({ email: this.email.trim() })

    // Focus first OTP input
    setTimeout(() => {
      const firstInput = this.shadowRoot?.querySelector('.signup-otp-input') as HTMLInputElement
      firstInput?.focus()
    }, 200)
  }

  private async handleSignupWithOtp() {
    const detail: SignUpDetail = {
      email: this.email.trim(),
      password: this.password,
      givenName: this.givenName.trim(),
      familyName: this.familyName.trim(),
      code: this.signupOtpDigits.join(''),
    }

    await this.getApiService().register({
      email: detail.email,
      password: detail.password,
      given_name: detail.givenName,
      family_name: detail.familyName,
      code: detail.code,
    })
    // if successful then login
    await this.handleSignIn()
  }

  private async handleRequestReset() {
    const detail: ResetRequestDetail = {
      email: this.email.trim(),
    }

    this.resetStep = 'confirm'
    this.notice = 'If an account exists, a 6-digit code has been sent'
    this.otpDigits = ['', '', '', '', '', '']

    await this.getApiService().requestResetPassword(detail)

    // Focus first OTP input
    setTimeout(() => {
      const firstInput = this.shadowRoot?.querySelector('.reset-otp-input') as HTMLInputElement
      firstInput?.focus()
    }, 100)
  }

  private async handleConfirmReset() {
    const detail: ResetConfirmDetail = {
      email: this.email.trim(),
      newPassword: this.newPassword,
      otp: this.otpDigits.join(''),
    }

    await this.getApiService().resetPassword({
      email: detail.email,
      newPassword: detail.newPassword,
      otp: detail.otp,
    })

    await this.handleSignIn()
  }

  public isUserLoggedIn(): boolean {
    // Cannot read HttpOnly cookies from JavaScript
    // Return local state only
    return this.isLoggedIn
  }

  public async logout() {
    try {
      if (!this.hasApiBaseUrl()) {
        this.error = this.baseUrlErrorMessage
        return
      }
      const apiService = this.getApiService()
      // Server reads HttpOnly cookies from request automatically
      const {
        redirectUrl,
        requiresRedirect
      } = await apiService.logout()

      // Determine the logout redirect URL
      let finalRedirectUrl = redirectUrl

      // If no redirect URL provided, use default oauth-spa logout flow
      if (requiresRedirect && !redirectUrl) {
        const currentUrl = window.location.href
        const oauthSpaDomain = 'https://cdn.cals-api.com'
        finalRedirectUrl = `${oauthSpaDomain}?logout=true&return_url=${encodeURIComponent(currentUrl)}`
      }

      if (requiresRedirect && finalRedirectUrl) {
        const currentHost = window.location.host
        const url = new URL(finalRedirectUrl)

        // Check if this is the oauth-spa default logout with return_url
        const isDefaultLogoutWithReturn =
          url.searchParams.get('logout') === 'true' &&
          url.searchParams.has('return_url')

        // If using default logout that will redirect back, don't open new window
        if (isDefaultLogoutWithReturn) {
          window.location.href = finalRedirectUrl
        } else if (url.host !== currentHost) {
          // Different host without return_url - open new window
          window.open(finalRedirectUrl, 'newWindow', 'width=400,height=500,resizable=yes,scrollbars=yes,status=yes')
        } else {
          // Same host - direct redirect
          window.location.href = finalRedirectUrl
        }
      }
    } catch (err) {
      log('Logout error:', err)
      // Continue even if API call fails
    } finally {
      // Always set isLoggedIn to false and clear user state
      // Server clears HttpOnly cookies automatically
      this.isLoggedIn = false
      this.userEmail = null
    }
  }

  // OAuth handlers
  private handleGoogleSignIn() {
    console.log('Google sign-in clicked')
    this.handleOAuthSignIn('google')
  }

  private handleAppleSignIn() {
    this.handleOAuthSignIn('apple')
  }

  private handleOAuthSignIn(provider: 'google' | 'apple') {
    // If oauth-spa-domain is configured, use centralized oauth-spa
    if (this.oauthSpaDomain?.trim()) {
      const spaDomain = this.oauthSpaDomain.trim()
      // Ensure it starts with https://
      const normalizedSpaDomain = spaDomain.startsWith('http://') || spaDomain.startsWith('https://')
        ? spaDomain
        : `https://${spaDomain}`

      // Remove trailing slash
      const baseDomain = normalizedSpaDomain.endsWith('/')
        ? normalizedSpaDomain.slice(0, -1)
        : normalizedSpaDomain

      // Build current page URL as return_url
      const returnUrl = window.location.href

      // Build oauth-spa redirect URL
      const oauthUrl = `${baseDomain}?return_url=${encodeURIComponent(returnUrl)}&provider=${provider}&theme=${this.theme}`

      console.log('Redirecting to oauth-spa:', oauthUrl)
      window.location.href = oauthUrl
      return
    }

    // Fall back to direct OAuth service (legacy behavior)
    if (provider === 'google') {
      this.getOAuthService()?.redirectToGoogleAuth()
    } else {
      this.getOAuthService()?.redirectToAppleAuth()
    }
  }

  // OTP input handlers
  private handleOtpInput(index: number, event: InputEvent, isSignup: boolean) {
    const target = event.target as HTMLInputElement
    const val = target.value.replace(/\D/g, '')

    if (!val) {
      if (isSignup) {
        this.signupOtpDigits[index] = ''
        this.signupOtpDigits = [...this.signupOtpDigits]
      } else {
        this.otpDigits[index] = ''
        this.otpDigits = [...this.otpDigits]
      }
      return
    }

    const digit = val[val.length - 1]
    if (isSignup) {
      this.signupOtpDigits[index] = digit
      this.signupOtpDigits = [...this.signupOtpDigits]
    } else {
      this.otpDigits[index] = digit
      this.otpDigits = [...this.otpDigits]
    }

    // Move to next input
    if (index < 5) {
      const nextInput = this.shadowRoot?.querySelector(
        `${isSignup ? '.signup-otp-input' : '.reset-otp-input'}[data-index="${index + 1}"]`
      ) as HTMLInputElement
      nextInput?.focus()
      nextInput?.select()
    } else {
      target.blur()
    }
  }

  private handleOtpKeydown(index: number, event: KeyboardEvent, isSignup: boolean) {
    const digits = isSignup ? this.signupOtpDigits : this.otpDigits

    if (event.key === 'Backspace') {
      if (digits[index]) {
        if (isSignup) {
          this.signupOtpDigits[index] = ''
          this.signupOtpDigits = [...this.signupOtpDigits]
        } else {
          this.otpDigits[index] = ''
          this.otpDigits = [...this.otpDigits]
        }
        return
      }
      if (index > 0) {
        const prevInput = this.shadowRoot?.querySelector(
          `${isSignup ? '.signup-otp-input' : '.reset-otp-input'}[data-index="${index - 1}"]`
        ) as HTMLInputElement
        prevInput?.focus()
        prevInput?.select()
        if (isSignup) {
          this.signupOtpDigits[index - 1] = ''
          this.signupOtpDigits = [...this.signupOtpDigits]
        } else {
          this.otpDigits[index - 1] = ''
          this.otpDigits = [...this.otpDigits]
        }
      }
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      const prevInput = this.shadowRoot?.querySelector(
        `${isSignup ? '.signup-otp-input' : '.reset-otp-input'}[data-index="${index - 1}"]`
      ) as HTMLInputElement
      prevInput?.focus()
      prevInput?.select()
      event.preventDefault()
    }

    if (event.key === 'ArrowRight' && index < 5) {
      const nextInput = this.shadowRoot?.querySelector(
        `${isSignup ? '.signup-otp-input' : '.reset-otp-input'}[data-index="${index + 1}"]`
      ) as HTMLInputElement
      nextInput?.focus()
      nextInput?.select()
      event.preventDefault()
    }

    if (event.key.length === 1 && /\D/.test(event.key)) {
      event.preventDefault()
    }
  }

  private handleOtpPaste(event: ClipboardEvent, isSignup: boolean) {
    const text = event.clipboardData?.getData('text') || ''
    const digits = text.replace(/\D/g, '').slice(0, 6).split('')
    if (digits.length === 0) return

    event.preventDefault()

    for (let i = 0; i < 6; i++) {
      if (isSignup) {
        this.signupOtpDigits[i] = digits[i] || ''
      } else {
        this.otpDigits[i] = digits[i] || ''
      }
    }

    if (isSignup) {
      this.signupOtpDigits = [...this.signupOtpDigits]
    } else {
      this.otpDigits = [...this.otpDigits]
    }

    const nextIndex = (isSignup ? this.signupOtpDigits : this.otpDigits).findIndex((d) => !d)
    if (nextIndex === -1) {
      const lastInput = this.shadowRoot?.querySelector(
        `${isSignup ? '.signup-otp-input' : '.reset-otp-input'}[data-index="5"]`
      ) as HTMLInputElement
      lastInput?.blur()
    } else {
      const nextInput = this.shadowRoot?.querySelector(
        `${isSignup ? '.signup-otp-input' : '.reset-otp-input'}[data-index="${nextIndex}"]`
      ) as HTMLInputElement
      nextInput?.focus()
      nextInput?.select()
    }
  }

  render() {
    if (!this.hasApiBaseUrl()) {
      const message = this.baseUrlErrorMessage
      return html`
        ${this.logoUrl.length > 0
          ? html`
              <header class="modal-header">
                <div class="auth-header">
                <img
                  src="${this.logoUrl}"
                  width="48"
                  height="48"
                  alt="Logo"
                  class="auth-logo"
                />
                </div>
              </header>
            `
          : nothing}

        <div class="modal-body">
          <div class="auth-form">
            <div class="alert alert--error">
              ${message}
            </div>
          </div>
        </div>
      `
    }

    // Show loading state during OAuth callback processing
    if (this.isLoading && this.hasHandledOAuthCallback) {
      return html`
        ${this.logoUrl.length > 0
          ? html`
              <header class="modal-header">
                <div class="auth-header">
                <img
                  src="${this.logoUrl}"
                  width="48"
                  height="48"
                  alt="Logo"
                  class="auth-logo"
                />
                </div>
              </header>
            `
          : nothing}

        <div class="modal-body">
          <div class="auth-form">
            <div class="form-actions">
              <base-button
                type="button"
                variant="primary"
                full-width
                loading
                disabled
              >
                Signing in...
              </base-button>
            </div>
            ${this.renderAlerts()}
          </div>
        </div>
      `
    }

    if (this.isLoggedIn) {
      return html`
        <!-- Header -->
        ${this.logoUrl.length > 0
          ? html`
              <header class="modal-header">
                <div class="auth-header">
                <img
                  src="${this.logoUrl}"
                  width="48"
                  height="48"
                  alt="Logo"
                  class="auth-logo"
                />
                </div>
              </header>
            `
          : nothing}

        <!-- Body -->
        <div class="modal-body">
          <div class="auth-form">
            <div class="form-actions">
              <base-button
                type="button"
                variant="primary"
                full-width
                @click=${this.logout}
              >
                Logout
              </base-button>
            </div>
            ${this.renderAlerts()}
          </div>
        </div>
      `
    }

    return html`
      <!-- Header -->
      ${(!this.mode || this.resetStep === 'none') && this.logoUrl.length > 0 && this.mode === 'signin'
        ? html`
            <header class="modal-header">

                <div class="auth-header">
              <img
                src="${this.logoUrl}"
                width="48"
                height="48"
                alt="Logo"
                class="auth-logo"
              />
                </div>
            </header>
          `
        : nothing}

      <!-- Body -->
      <div class="modal-body">
        <form @submit=${this.handleSubmit} class="auth-form" novalidate>
          ${this.renderFormContent()}

          <!-- Actions -->
          <div class="form-actions">
            ${this.renderActions()}
          </div>

          ${this.renderAlerts()}
        </form>

        ${this.renderFooter()}
      </div>
    `
  }

  private renderFormContent() {
    if (this.resetStep === 'none' && (!this.mode || this.mode === 'signin' || this.signupStep === 'form')) {
      return html`
        <!-- Email -->
        <base-input
          id="email-input"
          type="email"
          label="Email Address"
          placeholder="Enter your email"
          .value=${this.email}
          .error=${this.errors.email}
          ?required=${true}
          autocomplete="email"
          @input=${(e: CustomEvent) => (this.email = e.detail.value)}
        ></base-input>

        <!-- Password -->
        <base-input
          type="password"
          label="Password"
          placeholder="Enter your password"
          .value=${this.password}
          .error=${this.errors.password}
          ?required=${true}
          autocomplete=${this.mode === 'signup' ? 'new-password' : 'current-password'}
          @input=${(e: CustomEvent) => (this.password = e.detail.value)}
        ></base-input>

        ${this.mode === 'signin' && this.error
          ? html`
              <div class="forgot-row">
                <button type="button" class="text-btn" @click=${this.startReset}>
                  Forgot your password?
                </button>
              </div>
            `
          : nothing}

        ${this.mode === 'signup'
          ? html`
              <!-- Confirm Password -->
              <base-input
                type="password"
                label="Confirm Password"
                placeholder="Re-enter your password"
                .value=${this.confirmPassword}
                .error=${this.errors.confirm_password}
                ?required=${true}
                autocomplete="new-password"
                @input=${(e: CustomEvent) => (this.confirmPassword = e.detail.value)}
              ></base-input>

              <!-- First Name -->
              <base-input
                type="text"
                label="First Name"
                placeholder="Enter your first name"
                .value=${this.givenName}
                .error=${this.errors.givenName}
                ?required=${true}
                autocomplete="given-name"
                @input=${(e: CustomEvent) => (this.givenName = e.detail.value)}
              ></base-input>

              <!-- Last Name -->
              <base-input
                type="text"
                label="Last Name"
                placeholder="Enter your last name"
                .value=${this.familyName}
                .error=${this.errors.familyName}
                ?required=${true}
                autocomplete="family-name"
                @input=${(e: CustomEvent) => (this.familyName = e.detail.value)}
              ></base-input>
            `
          : nothing}
      `
    }

    if (this.mode === 'signup' && this.signupStep === 'otp') {
      return html`
        <div class="otp-section">
          <label class="otp-label">Enter 6-digit code</label>
          <div class="otp-inputs" role="group" aria-label="One time code">
            ${repeat(
              Array.from({ length: 6 }, (_, i) => i),
              (i) => i,
              (i) => html`
                <input
                  class="otp-input signup-otp-input ${this.errors.signup_otp ? 'otp-input--error' : ''}"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  maxlength="1"
                  data-index="${i}"
                  .value=${this.signupOtpDigits[i]}
                  @input=${(e: InputEvent) => this.handleOtpInput(i, e, true)}
                  @keydown=${(e: KeyboardEvent) => this.handleOtpKeydown(i, e, true)}
                  @paste=${(e: ClipboardEvent) => this.handleOtpPaste(e, true)}
                  aria-label="Digit ${i + 1}"
                />
              `
            )}
          </div>
          ${this.errors.signup_otp
            ? html`<p class="otp-error">${this.errors.signup_otp}</p>`
            : nothing}
        </div>
        <div class="forgot-row">
          <button type="button" class="text-btn" @click=${this.backToSignupForm}>
            Didn't get a code? Go back
          </button>
        </div>
      `
    }

    if (this.resetStep === 'request') {
      return html`
        <base-input
          id="email-input"
          type="email"
          label="Email Address"
          placeholder="Enter your email"
          .value=${this.email}
          .error=${this.errors.email}
          ?required=${true}
          autocomplete="email"
          @input=${(e: CustomEvent) => (this.email = e.detail.value)}
        ></base-input>
        <div class="forgot-row">
          <button type="button" class="text-btn" @click=${this.cancelReset}>
            Back to Sign In
          </button>
        </div>
      `
    }

    if (this.resetStep === 'confirm') {
      const otpComplete = this.otpDigits.every((d) => /^\d$/.test(d))

      return html`
        <base-input
          type="email"
          label="Email Address"
          placeholder="Enter your email"
          .value=${this.email}
          .error=${this.errors.email}
          ?required=${true}
          autocomplete="email"
          @input=${(e: CustomEvent) => (this.email = e.detail.value)}
        ></base-input>

        <div class="otp-section">
          <label class="otp-label">Enter 6-digit code</label>
          <div class="otp-inputs" role="group" aria-label="One time code">
            ${repeat(
              Array.from({ length: 6 }, (_, i) => i),
              (i) => i,
              (i) => html`
                <input
                  class="otp-input reset-otp-input ${this.errors.otp ? 'otp-input--error' : ''}"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  maxlength="1"
                  data-index="${i}"
                  .value=${this.otpDigits[i]}
                  @input=${(e: InputEvent) => this.handleOtpInput(i, e, false)}
                  @keydown=${(e: KeyboardEvent) => this.handleOtpKeydown(i, e, false)}
                  @paste=${(e: ClipboardEvent) => this.handleOtpPaste(e, false)}
                  aria-label="Digit ${i + 1}"
                />
              `
            )}
          </div>
          ${this.errors.otp ? html`<p class="otp-error">${this.errors.otp}</p>` : nothing}
        </div>

        ${otpComplete
          ? html`
              <div class="new-password-fields">
                <base-input
                  type="password"
                  label="New Password"
                  placeholder="Enter your new password"
                  .value=${this.newPassword}
                  .error=${this.errors.new_password}
                  ?required=${true}
                  autocomplete="new-password"
                  @input=${(e: CustomEvent) => (this.newPassword = e.detail.value)}
                ></base-input>

                <base-input
                  type="password"
                  label="Confirm New Password"
                  placeholder="Re-enter your new password"
                  .value=${this.confirmPassword}
                  .error=${this.errors.confirm_password}
                  ?required=${true}
                  autocomplete="new-password"
                  @input=${(e: CustomEvent) => (this.confirmPassword = e.detail.value)}
                ></base-input>
              </div>
            `
          : nothing}

        <div class="forgot-row">
          <button type="button" class="text-btn" @click=${this.backToRequest}>
            Didn't get a code? Resend
          </button>
        </div>
      `
    }

    return nothing
  }

  private renderActions() {
    if (this.resetStep === 'request') {
      return html`
        <base-button
          type="submit"
          variant="primary"
          full-width
          ?loading=${this.isLoading}
          ?disabled=${this.isLoading}
          @click=${(e: Event) => this.handleSubmit(e)}
        >
          ${this.isLoading ? 'Sending...' : 'Send Reset Code'}
        </base-button>
      `
    }

    if (this.resetStep === 'confirm') {
      const otpComplete = this.otpDigits.every((d) => /^\d$/.test(d))
      if (otpComplete) {
        return html`
          <base-button
            type="submit"
            variant="primary"
            full-width
            ?loading=${this.isLoading}
            ?disabled=${this.isLoading}
            @click=${(e: Event) => this.handleSubmit(e)}
          >
            ${this.isLoading ? 'Resetting...' : 'Reset Password'}
          </base-button>
        `
      }
      return nothing
    }

    if (this.mode === 'signup' && this.signupStep === 'otp') {
      const signupOtpComplete = this.signupOtpDigits.every((d) => /^\d$/.test(d))
      return html`
        <base-button
          type="submit"
          variant="primary"
          full-width
          ?loading=${this.isLoading}
          ?disabled=${!signupOtpComplete || this.isLoading}
          @click=${(e: Event) => this.handleSubmit(e)}
        >
          ${this.isLoading ? 'Completing...' : 'Complete Registration'}
        </base-button>
      `
    }

    return html`
      <base-button
        type="submit"
        variant="primary"
        full-width
        ?loading=${this.isLoading}
        ?disabled=${this.isLoading}
        @click=${(e: Event) => this.handleSubmit(e)}
      >
        ${this.isLoading
          ? 'Loading...'
          : this.mode === 'signup'
          ? 'Continue'
          : 'Sign In'}
      </base-button>

      ${this.isOAuthConfigured() && this.mode === 'signin'
        ? html`
            <div class="button-row">
              <button
                type="button"
                class="oauth-btn"
                @click=${this.handleGoogleSignIn}
                ?disabled=${this.isLoading}
              >
                ${this.renderGoogleIcon()}
              </button>

              <button
                type="button"
                class="oauth-btn"
                @click=${this.handleAppleSignIn}
                ?disabled=${this.isLoading}
              >
                ${this.renderAppleIcon()}
              </button>
            </div>
          `
        : nothing}
    `
  }

  private renderAlerts() {
    return html`
      ${this.notice
        ? html`
            <div class="alert alert--success">
              ${this.notice}
              <button class="alert-close" @click=${() => (this.notice = '')} aria-label="Dismiss">
                ×
              </button>
            </div>
          `
        : nothing}
      ${this.error
        ? html`
            <div class="alert alert--error">
              ${this.error}
              <button class="alert-close" @click=${() => (this.error = '')} aria-label="Dismiss">
                ×
              </button>
            </div>
          `
        : nothing}
    `
  }

  private renderFooter() {
    if (this.isLoggedIn) {
      return nothing
    }

    if (this.resetStep === 'none' && (!this.mode || this.mode === 'signin' || this.signupStep === 'form')) {
      // Don't show signup toggle if signup is disabled
      if (this.disableSignup) {
        return nothing
      }
      return html`
        <div class="auth-footer">
          <p class="toggle-text">
            ${this.mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
          </p>
          <button type="button" class="text-btn" @click=${this.toggleMode}>
            ${this.mode === 'signup' ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      `
    }

    return html`
      <div class="auth-footer">
        <p class="toggle-text">
          Having trouble? Email
          <a href="mailto:support@example.com">support@example.com</a>
        </p>
      </div>
    `
  }

  private renderGoogleIcon() {
    return html`
      <svg viewBox="-0.5 0 48 48" width="18" height="18" fill="none">
        <path d="M9.82727273,24 C9.82727273,22.4757333 10.0804318,21.0144 10.5322727,19.6437333 L2.62345455,13.6042667 C1.08206818,16.7338667 0.213636364,20.2602667 0.213636364,24 C0.213636364,27.7365333 1.081,31.2608 2.62025,34.3882667 L10.5247955,28.3370667 C10.0772273,26.9728 9.82727273,25.5168 9.82727273,24" fill="#FBBC05"></path>
        <path d="M23.7136364,10.1333333 C27.025,10.1333333 30.0159091,11.3066667 32.3659091,13.2266667 L39.2022727,6.4 C35.0363636,2.77333333 29.6954545,0.533333333 23.7136364,0.533333333 C14.4268636,0.533333333 6.44540909,5.84426667 2.62345455,13.6042667 L10.5322727,19.6437333 C12.3545909,14.112 17.5491591,10.1333333 23.7136364,10.1333333" fill="#EB4335"></path>
        <path d="M23.7136364,37.8666667 C17.5491591,37.8666667 12.3545909,33.888 10.5322727,28.3562667 L2.62345455,34.3946667 C6.44540909,42.1557333 14.4268636,47.4666667 23.7136364,47.4666667 C29.4455,47.4666667 34.9177955,45.4314667 39.0249545,41.6181333 L31.5177727,35.8144 C29.3995682,37.1488 26.7323182,37.8666667 23.7136364,37.8666667" fill="#34A853"></path>
        <path d="M46.1454545,24 C46.1454545,22.6133333 45.9318182,21.12 45.6113636,19.7333333 L23.7136364,19.7333333 L23.7136364,28.8 L36.3181818,28.8 C35.6879545,31.8912 33.9724545,34.2677333 31.5177727,35.8144 L39.0249545,41.6181333 C43.3393409,37.6138667 46.1454545,31.6490667 46.1454545,24" fill="#4285F4"></path>
      </svg>
    `
  }

  private renderAppleIcon() {
    return html`
      <svg viewBox="-3.5 0 48 48" width="18" height="18" class="apple-icon">
        <path d="M231.174735,567.792499 C232.740177,565.771699 233.926883,562.915484 233.497649,560 C230.939077,560.177808 227.948466,561.814769 226.203475,563.948463 C224.612784,565.88177 223.305444,568.757742 223.816036,571.549042 C226.613071,571.636535 229.499881,569.960061 231.174735,567.792499 L231.174735,567.792499 Z M245,595.217241 C243.880625,597.712195 243.341978,598.827022 241.899976,601.03692 C239.888467,604.121745 237.052156,607.962958 233.53412,607.991182 C230.411652,608.02505 229.606488,605.94498 225.367451,605.970382 C221.128414,605.99296 220.244696,608.030695 217.116618,607.999649 C213.601387,607.968603 210.913765,604.502761 208.902256,601.417937 C203.27452,592.79849 202.68257,582.680377 206.152914,577.298162 C208.621711,573.476705 212.515678,571.241407 216.173986,571.241407 C219.89682,571.241407 222.239372,573.296075 225.322563,573.296075 C228.313175,573.296075 230.133913,571.235762 234.440281,571.235762 C237.700215,571.235762 241.153726,573.022307 243.611302,576.10431 C235.554045,580.546683 236.85858,592.121127 245,595.217241 L245,595.217241 Z" transform="translate(-204.000000, -560.000000)" fill="#0b0b0a"></path>
      </svg>
    `
  }

  // Public methods for external control
  public setError(message: string) {
    this.error = message
  }

  public setNotice(message: string) {
    this.notice = message
  }

  public async refresh() {
    try {
      if (!this.hasApiBaseUrl()) {
        log('Skipping token refresh: API domain is not set')
        this.error = this.baseUrlErrorMessage
        return
      }

      // Server reads HttpOnly cookies from request and sets new ones
      await this.getApiService().refresh()
      // Tokens are refreshed server-side, state remains logged in
    } catch (err) {
      log('Token refresh failed:', err)
      this.isLoggedIn = false
    }
  }

  public getUserEmail(): string | null {
    // Return email from local state (stored after successful login)
    return this.userEmail
  }

  static styles = appStyles()
}
