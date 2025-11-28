import '../src/components/cals-auth.js'

await customElements.whenDefined('cals-auth');
const authElement = document.querySelector('cals-auth')

if (!authElement) {
  throw new Error('cals-auth element not found in the document')
}

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
const themeToggle = document.getElementById('theme-toggle')
const openModalButton = document.querySelector('.open-modal')
const logoutButton = document.getElementById('logout-button')

refreshButton?.addEventListener('click', async () => {
  try {
    await authElement.refresh()
  } catch (error) {
    console.error('Error refreshing tokens', error)
  }
})

themeToggle?.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme')
  if (currentTheme === 'dark') {
    document.documentElement.removeAttribute('data-theme')
    authElement.removeAttribute('data-theme')
    themeToggle.innerHTML = `<svg viewBox="0 0 20 20" fill="currentColor" class="theme-icon" aria-hidden="true">
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
    </svg>`
  } else {
    document.documentElement.setAttribute('data-theme', 'dark')
    authElement.setAttribute('data-theme', 'dark')
    themeToggle.innerHTML = `<svg
      viewBox="0 0 20 20"
      fill="currentColor"
      class="theme-icon"
      aria-hidden="true"
    >
      <path
        fill-rule="evenodd"
        d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
        clip-rule="evenodd"
      />
    </svg>`
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
