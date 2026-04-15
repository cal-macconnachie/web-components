import { css, html } from 'lit'
import { property, state } from 'lit/decorators.js'
import { BaseElement } from '../base-element'
import { register } from '../helpers/register'
import { BaseIcon } from './base-icon'

export interface ThemeInput {
  theme: string,
  icon: string
}

export const registerThemeToggle = () => {
  register({
    name: 'base-icon',
    element: BaseIcon
  })
  register({
    name: 'theme-toggle',
    element: ThemeToggle
  })
}
export class ThemeToggle extends BaseElement {
  @property({ type: String, attribute: 'size' }) size: 'xs' | 'sm' | 'md' | 'lg' = 'sm'
  @property({ type: String, attribute: 'variant' }) variant: 'ghost' | 'outline' | 'solid' = 'ghost'
  @property({ type: Object, attribute: 'themes' }) themes: ThemeInput[] = [
    { theme: 'light', icon: 'sun' },
    { theme: 'dark', icon: 'moon' },
  ]

  @state() private currentTheme = 0
  @state() private animating = false

  connectedCallback() {
    super.connectedCallback()
    this.syncCurrentTheme()
  }

  updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties)

    // Sync currentTheme index when themes array or theme value changes
    if (changedProperties.has('themes') || changedProperties.has('theme')) {
      this.syncCurrentTheme()
    }
  }

  private syncCurrentTheme() {
    const index = this.themes.findIndex(t => t.theme === this.theme)
    // If theme not found in array, default to 0, otherwise use found index
    this.currentTheme = index >= 0 ? index : 0
  }

  private toggleTheme() {
    this.currentTheme = (this.currentTheme + 1) % this.themes.length
    this.theme = this.themes[this.currentTheme]?.theme ?? 'light'
    super.applyTheme()

    // Trigger animation
    this.animating = false
    requestAnimationFrame(() => {
      this.animating = true
    })
  }

  private getSizeClass() {
    const sizes = {
      xs: 'btn--xs',
      sm: 'btn--sm',
      md: 'btn--md',
      lg: 'btn--lg',
    }
    return sizes[this.size] || sizes.sm
  }

  private getVariantClass() {
    const variants = {
      ghost: 'btn--ghost',
      outline: 'btn--outline',
      solid: 'btn--solid',
    }
    return variants[this.variant] || variants.ghost
  }

  private getIconSize() {
    const sizes = {
      xs: '18px',
      sm: '22px',
      md: '24px',
      lg: '28px',
    }
    return sizes[this.size] || sizes.sm
  }

  render() {
    const nextThemeIndex = (this.currentTheme + 1) % this.themes.length
    const nextTheme = this.themes[nextThemeIndex]
    const ariaLabel = `Switch to ${nextTheme?.theme ?? 'next'} theme`

    return html`
      <button
        class="theme-toggle ${this.getSizeClass()} ${this.getVariantClass()}"
        @click=${this.toggleTheme}
        aria-label=${ariaLabel}
        type="button"
      >
        <base-icon
          name="${nextTheme?.icon ?? 'sun'}"
          size="${this.getIconSize()}"
          class="theme-icon ${this.animating ? 'animating' : ''}"
        ></base-icon>

        <span class="sr-only">${ariaLabel}</span>
      </button>
    `
  }

  static styles = css`
    :host {
      display: inline-block;
    }

    .theme-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 0.375rem;
      transition: all 0.15s ease-in-out;
      font-family: inherit;
      font-weight: 500;
      position: relative;
      overflow: hidden;
      color: inherit;
    }

    .theme-toggle:focus {
      outline: none;
    }

    .theme-toggle:focus-visible {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }

    .theme-toggle:hover {
      transform: scale(1.05);
    }

    .theme-toggle:active .theme-icon {
      transform: scale(0.95);
    }

    /* Size variants */
    .btn--xs {
      padding: 0.375rem;
    }

    .btn--sm {
      padding: 0.5rem;
    }

    .btn--md {
      padding: 0.75rem;
    }

    .btn--lg {
      padding: 1rem;
    }

    /* Variant styles - Light mode */
    .btn--ghost {
      background: transparent;
      border: none;
    }

    .btn--ghost:hover {
      background: transparent;
      opacity: 0.7;
    }

    .btn--outline {
      border: 1px solid rgba(0, 0, 0, 0.2);
      background: transparent;
    }

    .btn--outline:hover {
      background: rgba(0, 0, 0, 0.05);
      border-color: rgba(0, 0, 0, 0.3);
    }

    .btn--solid {
      background: rgba(0, 0, 0, 0.1);
    }

    .btn--solid:hover {
      background: rgba(0, 0, 0, 0.15);
    }

    /* Dark mode adaptations */
    :host([theme="dark"]) .btn--ghost:hover {
      background: transparent;
      opacity: 0.7;
    }

    :host([theme="dark"]) .btn--outline {
      border-color: rgba(255, 255, 255, 0.2);
    }

    :host([theme="dark"]) .btn--outline:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.3);
    }

    :host([theme="dark"]) .btn--solid {
      background: rgba(255, 255, 255, 0.1);
    }

    :host([theme="dark"]) .btn--solid:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .theme-icon {
      transition: transform 0.15s ease-in-out;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }

    /* Animation for theme switching */
    @media (prefers-reduced-motion: no-preference) {
      .theme-icon.animating {
        animation: themeSwitch 0.3s ease-in-out;
      }
    }

    @keyframes themeSwitch {
      0% {
        transform: rotate(0deg) scale(1);
      }
      50% {
        transform: rotate(180deg) scale(0.8);
      }
      100% {
        transform: rotate(360deg) scale(1);
      }
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'theme-toggle': ThemeToggle
  }
}
