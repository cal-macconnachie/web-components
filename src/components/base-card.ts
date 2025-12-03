import { css, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { BaseElement } from '../base-element'

type CardVariant = 'default' | 'elevated'
type CardPadding = 'auto' | 'none' | 'sm' | 'md' | 'lg'

@customElement('base-card')
export class BaseCard extends BaseElement {
  @property({ type: String, attribute: 'variant' }) variant: CardVariant = 'default'
  @property({ type: String, attribute: 'padding' }) padding: CardPadding = 'none'
  @property({ type: Boolean, reflect: true, attribute: 'hoverable' }) hoverable = false
  @property({ type: Boolean, reflect: true, attribute: 'expandable' }) expandable = false
  @state() private isExpanded = false

  static styles = css`
    :host {
      display: block;
    }

    .base-card {
      background-color: var(--color-bg-primary);
      border-radius: var(--radius-lg);
      transition: all var(--transition-fast);
      position: relative;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      max-width: 100%;
    }

    /* Variants */
    .base-card--default {
      border: none;
    }

    .base-card--elevated {
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
    }

    /* Padding variants */
    .base-card--padding-auto {
      padding: auto;
    }
    .base-card--padding-none {
      padding: 0;
    }

    .base-card--padding-sm {
      padding: var(--space-4);
    }

    .base-card--padding-md {
      padding: var(--space-6);
    }

    .base-card--padding-lg {
      padding: var(--space-8);
    }

    /* Hoverable */
    .base-card--hoverable {
      cursor: pointer;
    }

    .base-card--hoverable:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(0px);
    }

    /* Expandable card styles */
    .base-card--expandable {
      position: relative;
    }

    .expand-btn {
      position: absolute;
      top: var(--space-3);
      right: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-2);
      cursor: pointer;
      color: var(--color-text-secondary);
      transition: all var(--transition-fast);
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transform: scale(0.8);
      pointer-events: none;
      background: none;
    }

    .base-card--expandable:hover .expand-btn {
      opacity: 1;
      transform: scale(1);
      pointer-events: auto;
    }

    .expand-btn:hover {
      background: var(--color-bg-muted);
      color: var(--color-text-primary);
      box-shadow: var(--shadow-sm);
    }

    .expand-btn:focus {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
      opacity: 1;
      transform: scale(1);
      pointer-events: auto;
    }

    /* Mobile: always show expand button */
    @media (max-width: 768px) {
      .expand-btn {
        opacity: 1;
        transform: scale(1);
        pointer-events: auto;
      }
    }

    /* Expanded overlay */
    .expanded-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-6);
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .expanded-card {
      max-width: 1200px;
      max-height: 90vh;
      width: 100%;
      overflow: auto;
      animation: scaleIn 0.2s ease-out;
    }

    @keyframes scaleIn {
      from {
        transform: scale(0.9);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }

    .close-btn {
      position: absolute;
      top: var(--space-4);
      right: var(--space-4);
      width: 40px;
      height: 40px;
      border: none;
      border-radius: var(--radius-full);
      background: var(--color-bg-primary);
      color: var(--color-text-primary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-lg);
      transition: all var(--transition-fast);
      z-index: 10;
    }

    .close-btn:hover {
      background: var(--color-bg-muted);
      transform: scale(1.1);
    }

    .close-btn:focus {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }
  `

  private handleExpand(e: Event) {
    e.stopPropagation()
    this.isExpanded = true
    document.body.style.overflow = 'hidden'

    // Dispatch custom event
    this.dispatchEvent(
      new CustomEvent('card-expanded', {
        bubbles: true,
        composed: true,
      })
    )
  }

  private handleCollapse(e: Event) {
    e.stopPropagation()
    this.isExpanded = false
    document.body.style.overflow = ''

    // Dispatch custom event
    this.dispatchEvent(
      new CustomEvent('card-collapsed', {
        bubbles: true,
        composed: true,
      })
    )
  }

  private handleOverlayClick(e: Event) {
    if (e.target === e.currentTarget) {
      this.handleCollapse(e)
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    document.body.style.overflow = ''
  }

  render() {
    const classes = {
      'base-card': true,
      [`base-card--${this.variant}`]: true,
      [`base-card--padding-${this.padding}`]: true,
      'base-card--hoverable': this.hoverable,
      'base-card--expandable': this.expandable,
    }

    const cardContent = html`
      <div class=${classMap(classes)}>
        ${this.expandable && !this.isExpanded
          ? html`
              <button
                class="expand-btn"
                aria-label="Expand card"
                @click=${this.handleExpand}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                </svg>
              </button>
            `
          : ''}
        <slot></slot>
      </div>
    `

    if (this.isExpanded) {
      return html`
        <div class="expanded-overlay" @click=${this.handleOverlayClick}>
          <div class="expanded-card">
            ${cardContent}
          </div>
        </div>
      `
    }

    return cardContent
  }
}
