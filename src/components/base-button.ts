import { css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { BaseElement } from '../base-element'

type ButtonVariant =
  // Solid variants
  | 'solid-primary' | 'solid-secondary' | 'solid-danger' | 'solid-warning' | 'solid-info' | 'solid-success'
  // Outlined variants
  | 'outlined-primary' | 'outlined-secondary' | 'outlined-danger' | 'outlined-warning' | 'outlined-info' | 'outlined-success'
  // Ghost variants (with background on hover)
  | 'ghost-primary' | 'ghost-secondary' | 'ghost-danger' | 'ghost-warning' | 'ghost-info' | 'ghost-success'
  // Link variants (text color change only)
  | 'link-primary' | 'link-secondary' | 'link-danger' | 'link-warning' | 'link-info' | 'link-success'
  // Legacy support (backwards compatibility)
  | 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

@customElement('base-button')
export class BaseButton extends BaseElement {
  @property({ type: String, attribute: 'size' }) size: ButtonSize = 'md'
  @property({ type: String, attribute: 'variant' }) variant: ButtonVariant = 'primary'
  @property({ type: String, attribute: 'hover' }) hover: ButtonVariant | undefined = undefined
  @property({ type: Boolean, reflect: true }) disabled = false
  @property({ type: Boolean, reflect: true, attribute: 'full-width' }) fullWidth = false
  @property({ type: Boolean, reflect: true, attribute: 'loading' }) loading = false
  @property({ type: String, attribute: 'type' }) type: 'button' | 'submit' | 'reset' = 'button'

  static styles = css`
    :host {
      display: inline-block;
    }

    :host([full-width]) {
      display: block;
      width: 100%;
    }

    /* Base button styles */
    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      font-family: var(--font-family-sans);
      font-weight: var(--font-weight-medium);
      line-height: var(--line-height-tight);
      border: 1px solid transparent;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition-fast);
      text-decoration: none;
      white-space: nowrap;
      user-select: none;
      position: relative;
      width: 100%;
    }

    button:focus-visible {
      outline: 2px solid var(--color-border-focus);
      outline-offset: 2px;
    }

    /* Variants */

    /* ========== SOLID VARIANTS ========== */
    .base-button--solid-primary {
      background-color: var(--color-primary);
      color: var(--color-text-inverse);
      border-color: var(--color-primary);
    }

    .base-button--solid-primary:hover:not(:disabled):not(.base-button--confirming) {
      background-color: var(--color-primary-hover);
      border-color: var(--color-primary-hover);
    }

    .base-button--solid-secondary {
      background-color: var(--color-secondary);
      color: var(--color-text-inverse);
      border-color: var(--color-secondary);
    }

    .base-button--solid-secondary:hover:not(:disabled):not(.base-button--confirming) {
      background-color: var(--color-secondary-hover);
      border-color: var(--color-secondary-hover);
    }

    .base-button--solid-danger {
      background-color: var(--color-error);
      color: var(--color-text-inverse);
      border-color: var(--color-error);
    }

    .base-button--solid-danger:hover:not(:disabled):not(.base-button--confirming) {
      background-color: var(--color-error-hover, #dc2626);
      border-color: var(--color-error-hover, #dc2626);
    }

    .base-button--solid-warning {
      background-color: var(--color-warning);
      color: var(--color-text-inverse);
      border-color: var(--color-warning);
    }

    .base-button--solid-warning:hover:not(:disabled):not(.base-button--confirming) {
      background-color: var(--color-warning-hover, #f59e0b);
      border-color: var(--color-warning-hover, #f59e0b);
    }

    .base-button--solid-info {
      background-color: var(--color-info);
      color: var(--color-text-inverse);
      border-color: var(--color-info);
    }

    .base-button--solid-info:hover:not(:disabled):not(.base-button--confirming) {
      background-color: var(--color-info-hover, #0ea5e9);
      border-color: var(--color-info-hover, #0ea5e9);
    }

    .base-button--solid-success {
      background-color: var(--color-success);
      color: var(--color-text-inverse);
      border-color: var(--color-success);
    }

    .base-button--solid-success:hover:not(:disabled):not(.base-button--confirming) {
      background-color: var(--color-success-hover, #16a34a);
      border-color: var(--color-success-hover, #16a34a);
    }

    /* ========== OUTLINED VARIANTS ========== */
    .base-button--outlined-primary {
      background-color: transparent;
      color: var(--color-primary);
      border-color: var(--color-border);
    }

    .base-button--outlined-primary:hover:not(:disabled):not(.base-button--confirming) {
      background-color: var(--color-primary-light);
      border-color: var(--color-primary);
    }

    .base-button--outlined-secondary {
      background-color: transparent;
      color: var(--color-secondary);
      border-color: var(--color-border);
    }

    .base-button--outlined-secondary:hover:not(:disabled):not(.base-button--confirming) {
      background-color: var(--color-secondary-light, rgba(99, 102, 241, 0.1));
      border-color: var(--color-secondary);
    }

    .base-button--outlined-danger {
      background-color: transparent;
      color: var(--color-error);
      border-color: var(--color-border);
    }

    .base-button--outlined-danger:hover:not(:disabled):not(.base-button--confirming) {
      background-color: var(--color-error-light, rgba(239, 68, 68, 0.1));
      border-color: var(--color-error);
    }

    .base-button--outlined-warning {
      background-color: transparent;
      color: var(--color-warning);
      border-color: var(--color-border);
    }

    .base-button--outlined-warning:hover:not(:disabled):not(.base-button--confirming) {
      background-color: var(--color-warning-light, rgba(251, 146, 60, 0.1));
      border-color: var(--color-warning);
    }

    .base-button--outlined-info {
      background-color: transparent;
      color: var(--color-info);
      border-color: var(--color-border);
    }

    .base-button--outlined-info:hover:not(:disabled):not(.base-button--confirming) {
      background-color: var(--color-info-light, rgba(14, 165, 233, 0.1));
      border-color: var(--color-info);
    }

    .base-button--outlined-success {
      background-color: transparent;
      color: var(--color-success);
      border-color: var(--color-border);
    }

    .base-button--outlined-success:hover:not(:disabled):not(.base-button--confirming) {
      background-color: var(--color-success-light, rgba(34, 197, 94, 0.1));
      border-color: var(--color-success);
    }

    /* ========== GHOST VARIANTS (background on hover, no border) ========== */
    .base-button--ghost-primary {
      background-color: transparent;
      color: var(--color-primary);
      border-color: transparent;
    }

    .base-button--ghost-primary:hover:not(:disabled):not(.base-button--confirming) {
      background-color: var(--color-primary-light);
    }

    .base-button--ghost-secondary {
      background-color: transparent;
      color: var(--color-secondary);
      border-color: transparent;
    }

    .base-button--ghost-secondary:hover:not(:disabled):not(.base-button--confirming) {
      background-color: var(--color-secondary-light, rgba(99, 102, 241, 0.1));
    }

    .base-button--ghost-danger {
      background-color: transparent;
      color: var(--color-error);
      border-color: transparent;
    }

    .base-button--ghost-danger:hover:not(:disabled):not(.base-button--confirming) {
      background-color: var(--color-error-light, rgba(239, 68, 68, 0.1));
    }

    .base-button--ghost-warning {
      background-color: transparent;
      color: var(--color-warning);
      border-color: transparent;
    }

    .base-button--ghost-warning:hover:not(:disabled):not(.base-button--confirming) {
      background-color: var(--color-warning-light, rgba(251, 146, 60, 0.1));
    }

    .base-button--ghost-info {
      background-color: transparent;
      color: var(--color-info);
      border-color: transparent;
    }

    .base-button--ghost-info:hover:not(:disabled):not(.base-button--confirming) {
      background-color: var(--color-info-light, rgba(14, 165, 233, 0.1));
    }

    .base-button--ghost-success {
      background-color: transparent;
      color: var(--color-success);
      border-color: transparent;
    }

    .base-button--ghost-success:hover:not(:disabled):not(.base-button--confirming) {
      background-color: var(--color-success-light, rgba(34, 197, 94, 0.1));
    }

    /* ========== LINK VARIANTS (text color only, like old ghost) ========== */
    .base-button--link-primary {
      background-color: transparent;
      color: var(--color-text-secondary);
      border-color: transparent;
    }

    .base-button--link-primary:hover:not(:disabled):not(.base-button--confirming) {
      color: var(--color-primary);
    }

    .base-button--link-secondary {
      background-color: transparent;
      color: var(--color-text-secondary);
      border-color: transparent;
    }

    .base-button--link-secondary:hover:not(:disabled):not(.base-button--confirming) {
      color: var(--color-secondary);
    }

    .base-button--link-danger {
      background-color: transparent;
      color: var(--color-text-secondary);
      border-color: transparent;
    }

    .base-button--link-danger:hover:not(:disabled):not(.base-button--confirming) {
      color: var(--color-error);
    }

    .base-button--link-warning {
      background-color: transparent;
      color: var(--color-text-secondary);
      border-color: transparent;
    }

    .base-button--link-warning:hover:not(:disabled):not(.base-button--confirming) {
      color: var(--color-warning);
    }

    .base-button--link-info {
      background-color: transparent;
      color: var(--color-text-secondary);
      border-color: transparent;
    }

    .base-button--link-info:hover:not(:disabled):not(.base-button--confirming) {
      color: var(--color-info);
    }

    .base-button--link-success {
      background-color: transparent;
      color: var(--color-text-secondary);
      border-color: transparent;
    }

    .base-button--link-success:hover:not(:disabled):not(.base-button--confirming) {
      color: var(--color-success);
    }

    /* ========== LEGACY VARIANTS (backwards compatibility) ========== */
    .base-button--primary {
      background-color: var(--color-primary);
      color: var(--color-text-inverse);
      border-color: var(--color-primary);
    }

    .base-button--primary:hover:not(:disabled):not(.base-button--confirming) {
      background-color: var(--color-primary-hover);
      border-color: var(--color-primary-hover);
    }

    .base-button--secondary {
      background-color: var(--color-secondary);
      color: var(--color-text-inverse);
      border-color: var(--color-secondary);
    }

    .base-button--secondary:hover:not(:disabled):not(.base-button--confirming) {
      background-color: var(--color-secondary-hover);
      border-color: var(--color-secondary-hover);
    }

    .base-button--outline {
      background-color: transparent;
      color: var(--color-primary);
      border-color: var(--color-border);
    }

    .base-button--outline:hover:not(:disabled):not(.base-button--confirming) {
      background-color: var(--color-primary-light);
      border-color: var(--color-primary);
    }

    .base-button--ghost {
      background-color: transparent;
      color: var(--color-text-secondary);
      border-color: transparent;
    }

    .base-button--ghost:hover:not(:disabled):not(.base-button--confirming) {
      color: var(--color-text-primary);
    }

    .base-button--danger {
      background-color: var(--color-error);
      color: var(--color-text-inverse);
      border-color: var(--color-error);
    }

    .base-button--danger:hover:not(:disabled):not(.base-button--confirming) {
      background-color: var(--color-error-hover, #dc2626);
      border-color: var(--color-error-hover, #dc2626);
    }

    /* Sizes */
    .base-button--xs {
      padding: var(--space-1) var(--space-2);
      font-size: var(--font-size-xs);
    }

    .base-button--sm {
      padding: var(--space-2) var(--space-3);
      font-size: var(--font-size-sm);
    }

    .base-button--md {
      padding: var(--space-3) var(--space-4);
      font-size: var(--font-size-base);
    }

    .base-button--lg {
      padding: var(--space-4) var(--space-6);
      font-size: var(--font-size-lg);
    }

    /* States */
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .base-button--loading {
      cursor: wait;
    }

    .button-content {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: inherit;
    }

    .button-text {
      transition: opacity var(--transition-fast);
    }

    .button-text.hidden {
      opacity: 0;
    }

    .loading-container {
      filter: brightness(400%);
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .loading-container ::slotted(*),
    .loading-container svg {
      width: 1.5em;
      height: 1.5em;
      display: block;
      animation: spin 1s linear infinite;
    }

    /* Spinner animation */
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `

  connectedCallback() {
    super.connectedCallback()
  }

  render() {
    const classes = {
      'base-button': true,
      [`base-button--${this.variant}`]: true,
      [`base-button--${this.size}`]: true,
      'base-button--full-width': this.fullWidth,
      'base-button--loading': this.loading,
      [`base-button--hover-${this.hover}`]: !!this.hover,
    }

    return html`
      <button
        class=${classMap(classes)}
        type=${this.type}
        ?disabled=${this.disabled || this.loading}
      >
        <span class="button-content">
          <span class=${classMap({ 'button-text': true, hidden: this.loading })}>
            <slot></slot>
          </span>
          ${this.loading
            ? html`
                <span class="loading-container">
                  <slot name="loading">
                    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                      <g transform="translate(20, 20)" opacity="0.3">
                        <line x1="-11" y1="0" x2="11" y2="0" stroke="#6366f1" stroke-width="2" stroke-linecap="round"/>
                        <circle cx="-15" cy="0" r="4" fill="#a855f7" />
                        <circle cx="15" cy="0" r="4" fill="#22c55e" />
                      </g>
                      <g transform="translate(20, 20)">
                        <circle cx="-15" cy="0" r="4" fill="none" stroke="#a855f7" stroke-width="0.1" filter="url(#dropShadow)"/>
                        <circle cx="15" cy="0" r="4" fill="none" stroke="#22c55e" stroke-width="0.1" filter="url(#dropShadow)"/>
                        <line x1="-11.1" y1="1" x2="11.1" y2="1" stroke="#6366f1" stroke-width="0.1"/>
                        <line x1="-11.1" y1="-1" x2="11.1" y2="-1" stroke="#6366f1" stroke-width="0.1"/>
                      </g>
                    </svg>
                  </slot>
                </span>
              `
            : ''}
        </span>
      </button>
    `
  }
}