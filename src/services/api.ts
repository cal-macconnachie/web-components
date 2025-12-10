export const api = ({
  baseUrl
}: {
  baseUrl: string
}) => {
  const endpoints = {
    login: 'auth/login',
    logout: 'auth/logout',
    refresh: 'auth/refresh',
    requestRegisterOtp: 'auth/request-register-otp',
    register: 'auth/register',
    requestResetPassword: 'auth/request-reset-password',
    resetPassword: 'auth/reset-password',
  }
  const login = async ({
    email, password, accessToken, refreshToken, idToken
  }: {email?: string, password?: string, accessToken?: string, refreshToken?: string, idToken?: string}): Promise<{
    message: 'Login successful',
    user: {
      email: string,
      given_name: string,
      family_name: string
    }
  }> => {
    const response = await fetch(`${baseUrl}${endpoints.login}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email,
        password,
        accessToken,
        refreshToken,
        idToken
      }),
    })
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || errorData.error || 'Login failed')
    }
    return response.json()
  }
  const logout = async (): Promise<{
    message: string
    redirectUrl?: string
    requiresRedirect?: boolean
  }> => {
    const response = await fetch(`${baseUrl}${endpoints.logout}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || errorData.error || 'Logout failed')
    }
    return response.json()
  }
  const refresh = async (): Promise<{
    message: string
  }> => {
    const response = await fetch(`${baseUrl}${endpoints.refresh}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || errorData.error || 'Failed to refresh token')
    }
    return response.json()
  }
  const requestRegisterOtp = async ({ email }: { email: string }): Promise<{ message: string }> => {
    const response = await fetch(`${baseUrl}${endpoints.requestRegisterOtp}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email
      }),
    })
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || errorData.error || 'Failed to request OTP')
    }
    return response.json()
  }
  const register = async ({
    email, password, phone_number, family_name, given_name, code
  }: {
    email: string, password: string, phone_number?: string, family_name: string, given_name: string, code: string
  }): Promise<{
    message: string
  }> => {
    const response = await fetch(`${baseUrl}${endpoints.register}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email,
        password,
        phone_number,
        family_name,
        given_name,
        code
      }),
    })
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || errorData.error || 'Registration failed')
    }
    return response.json()
  }
  const requestResetPassword = async ({ email }: { email: string }): Promise<{ message: string }> => {
    const response = await fetch(`${baseUrl}${endpoints.requestResetPassword}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email
      }),
    })
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || errorData.error || 'Failed to request password reset')
    }
    return response.json()
  }
  const resetPassword = async ({
    email, otp, newPassword
  }: {
    email: string, otp: string, newPassword: string
  }): Promise<{
    message: string
  }> => {
    const response = await fetch(`${baseUrl}${endpoints.resetPassword}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email,
        otp,
        newPassword
      }),
    })
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || errorData.error || 'Failed to reset password')
    }
    return response.json()
  }
  return {
    login,
    logout,
    refresh,
    requestRegisterOtp,
    register,
    requestResetPassword,
    resetPassword,
  }
}