import '../src/components/auth.js'
import '../src/components/theme-toggle.js'

await customElements.whenDefined('auth');
const authElement = document.querySelector('auth')

if (!authElement) {
  throw new Error('auth element not found in the document')
}

await customElements.whenDefined('theme-toggle');
const themeToggleElement = document.querySelector('theme-toggle')

const env = import.meta.env as Record<string, string | undefined>
const applyEnvAttribute = (attr: string, envKey: string) => {
  const value = env?.[envKey]
  if (typeof value === 'string' && value.trim().length > 0) {
    authElement.setAttribute(attr, value.trim())
  }
}

applyEnvAttribute('oauth-domain', 'VITE_COGNITO_DOMAIN')
applyEnvAttribute('oauth-region', 'VITE_COGNITO_REGION')
applyEnvAttribute('oauth-user-pool-id', 'VITE_COGNITO_USER_POOL_ID')
applyEnvAttribute('oauth-client-id', 'VITE_COGNITO_CLIENT_ID')

const refreshButton = document.getElementById('refresh-button')
const openModalButton = document.querySelector('.open-modal')
const logoutButton = document.getElementById('logout-button')

// Listen for theme changes from the theme toggle component
themeToggleElement?.addEventListener('theme-changed', ((event: CustomEvent) => {
  const theme = event.detail.theme
  // Update auth component theme to match
  if (theme === 'dark') {
    authElement.setAttribute('data-theme', 'dark')
  } else {
    authElement.removeAttribute('data-theme')
  }
}) as EventListener)

refreshButton?.addEventListener('click', async () => {
  try {
    await authElement.refresh()
  } catch (error) {
    console.error('Error refreshing tokens', error)
  }
})

openModalButton?.addEventListener('click', () => {
  authElement.openModal()
})

logoutButton?.addEventListener('click', async () => {
  try {
    await authElement.logout()
  } catch (error) {
    console.error('Error logging out', error)
  }
})
