import { LitElement } from 'lit'
import { property } from 'lit/decorators.js'

export class BaseElement extends LitElement {
  @property({ type: String, attribute: 'data-theme', reflect: true }) theme: 'light' | 'dark' = 'light'
  @property({ type: String, attribute: 'storage-key' }) storageKey = 'theme-preference'

  private boundThemeChangeHandler = this.handleGlobalThemeChange.bind(this)

  connectedCallback() {
    super.connectedCallback()
    // Initialize theme from document, localStorage, or system preference
    const documentTheme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark' | null
    const storedTheme = localStorage.getItem(this.storageKey) as 'light' | 'dark' | null
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    // Priority: document theme (already set) > localStorage > system preference
    if (documentTheme) {
      this.theme = documentTheme
    } else if (storedTheme) {
      this.theme = storedTheme
      this.applyTheme()
    } else if (prefersDark) {
      this.theme = 'dark'
      this.applyTheme()
    } else {
      this.applyTheme()
    }

    // Listen for theme changes from other components
    window.addEventListener('theme-changed', this.boundThemeChangeHandler)
  }

  disconnectedCallback() {
    window.removeEventListener('theme-changed', this.boundThemeChangeHandler)
    super.disconnectedCallback()
  }

  private handleGlobalThemeChange(event: Event) {
    const customEvent = event as CustomEvent<{ theme: 'light' | 'dark' }>
    // Only update if the event came from a different component
    if (customEvent.target !== this && customEvent.detail.theme !== this.theme) {
      this.theme = customEvent.detail.theme
    }
  }

  public applyTheme() {
    document.documentElement.setAttribute('data-theme', this.theme)
    localStorage.setItem(this.storageKey, this.theme)

    // Dispatch custom event for external listeners
    this.dispatchEvent(
      new CustomEvent('theme-changed', {
        detail: { theme: this.theme },
        bubbles: true,
        composed: true,
      })
    )
  }
}