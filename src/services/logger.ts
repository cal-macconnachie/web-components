
export const log = (...args: unknown[]) => {
  if (window.location.hostname === 'localhost' || window.DEBUG_LOGS === 'true') {
    console.log('[cals-auth]', ...args)
  }
}
