import { css, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { BaseElement } from '../base-element'

@customElement('theme-toggle')
export class ThemeToggle extends BaseElement {
  @property({ type: String, attribute: 'size' }) size: 'sm' | 'md' | 'lg' = 'sm'
  @property({ type: String, attribute: 'variant' }) variant: 'ghost' | 'outline' | 'solid' = 'ghost'

  @state() private isDark = false

  connectedCallback() {
    super.connectedCallback()
    // Initialize isDark based on the current theme (which may have been set by BaseElement)
    this.isDark = this.theme === 'dark'
  }

  private toggleTheme() {
    this.theme = this.isDark ? 'light' : 'dark'
    this.isDark = !this.isDark
    super.applyTheme()
  }

  private getSizeClass() {
    const sizes = {
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

  render() {
    const ariaLabel = this.isDark ? 'Switch to light mode' : 'Switch to dark mode'

    return html`
      <button
        class="theme-toggle ${this.getSizeClass()} ${this.getVariantClass()}"
        @click=${this.toggleTheme}
        aria-label=${ariaLabel}
        type="button"
      >
        ${this.isDark
          ? html`
              <svg
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
              </svg>
            `
          : html`
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                class="theme-icon"
                aria-hidden="true"
              >
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            `}

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
      width: 1.25rem;
      height: 1.25rem;
      transition: transform 0.15s ease-in-out;
    }

    .btn--md .theme-icon {
      width: 1.5rem;
      height: 1.5rem;
    }

    .btn--lg .theme-icon {
      width: 1.75rem;
      height: 1.75rem;
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
      .theme-icon {
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
