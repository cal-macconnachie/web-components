import { css, html } from 'lit'
import { property, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { BaseElement } from '../base-element'
import { register } from '../helpers/register'

type ListSize = 'sm' | 'md' | 'lg'
type ListVariant = 'default' | 'bordered' | 'divided'

export const registerBaseList = () => register({
  name: 'base-list',
  element: BaseList
})

export class BaseList extends BaseElement {
  @property({ type: String, attribute: 'size' }) size: ListSize = 'md'
  @property({ type: String, attribute: 'variant' }) variant: ListVariant = 'default'
  @property({ type: Boolean, reflect: true, attribute: 'interactive' }) interactive = false
  @property({ type: String, attribute: 'role' }) role: string = 'list'
  @property({ type: String, attribute: 'pull-action-icon' }) pullActionIcon?: string

  @state() private isPulling = false
  @state() private pullDistance = 0
  private startY = 0
  private pullThreshold = 80
  private listElement?: HTMLElement

  static styles = css`
    :host {
      display: block;
      width: 100%;
      position: relative;
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    :host::-webkit-scrollbar {
      display: none;
    }

    .base-list-wrapper {
      position: relative;
      overflow: hidden;
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    .base-list-wrapper::-webkit-scrollbar {
      display: none;
    }

    .pull-indicator {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 80px;
      transform: translateY(-100%);
      transition: transform var(--transition-normal);
      opacity: 0;
      pointer-events: none;
    }

    .pull-indicator--active {
      opacity: 1;
    }

    .pull-indicator__icon {
      font-size: 24px;
      color: var(--color-text-muted);
      transition: transform var(--transition-normal);
    }

    .pull-indicator--threshold .pull-indicator__icon {
      transform: rotate(180deg);
    }

    .base-list {
      display: flex;
      flex-direction: column;
      width: 100%;
      background-color: inherit;
      transition: transform var(--transition-normal);
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    .base-list::-webkit-scrollbar {
      display: none;
    }

    .base-list--pulling {
      transition: none;
    }

    /* Variants */
    .base-list--default {
      gap: 0;
    }

    .base-list--bordered {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      gap: 0;
    }

    .base-list--divided {
      gap: 0;
    }

    .base-list--divided ::slotted(base-list-item:not(:last-child)) {
      border-bottom: 1px solid var(--color-border);
    }

    /* Size variants - affects spacing between items for default variant only */
    .base-list--sm.base-list--default {
      gap: var(--space-1);
    }

    .base-list--md.base-list--default {
      gap: var(--space-2);
    }

    .base-list--lg.base-list--default {
      gap: var(--space-3);
    }

    /* Interactive lists */
    .base-list--interactive ::slotted(base-list-item) {
      cursor: pointer;
      transition: background-color var(--transition-fast);
    }

    .base-list--interactive ::slotted(base-list-item:hover) {
      background-color: var(--color-bg-muted);
    }

    .base-list--interactive ::slotted(base-list-item:focus-visible) {
      outline: 2px solid var(--color-border-focus);
      outline-offset: -2px;
    }
  `

  connectedCallback() {
    super.connectedCallback()
    if (this.pullActionIcon) {
      this.updateComplete.then(() => {
        this.listElement = this.shadowRoot?.querySelector('.base-list') as HTMLElement
        this.setupPullListeners()
      })
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this.removePullListeners()
  }

  private setupPullListeners() {
    if (!this.listElement) return
    this.listElement.addEventListener('touchstart', this.handleTouchStart, { passive: false })
    this.listElement.addEventListener('touchmove', this.handleTouchMove, { passive: false })
    this.listElement.addEventListener('touchend', this.handleTouchEnd)
  }

  private removePullListeners() {
    if (!this.listElement) return
    this.listElement.removeEventListener('touchstart', this.handleTouchStart)
    this.listElement.removeEventListener('touchmove', this.handleTouchMove)
    this.listElement.removeEventListener('touchend', this.handleTouchEnd)
  }

  private handleTouchStart = (e: TouchEvent) => {
    if (this.listElement && this.listElement.scrollTop === 0) {
      this.startY = e.touches[0].clientY
    }
  }

  private handleTouchMove = (e: TouchEvent) => {
    if (!this.listElement || this.startY === 0) return

    const currentY = e.touches[0].clientY
    const diff = currentY - this.startY

    if (diff > 0 && this.listElement.scrollTop === 0) {
      e.preventDefault()
      this.isPulling = true
      this.pullDistance = Math.min(diff * 0.5, this.pullThreshold * 1.5)
    }
  }

  private handleTouchEnd = () => {
    if (!this.isPulling) return

    if (this.pullDistance >= this.pullThreshold) {
      this.dispatchEvent(new CustomEvent('list-pulled', {
        bubbles: true,
        composed: true
      }))
    }

    this.isPulling = false
    this.pullDistance = 0
    this.startY = 0
  }

  render() {
    const listClasses = {
      'base-list': true,
      [`base-list--${this.size}`]: true,
      [`base-list--${this.variant}`]: true,
      'base-list--interactive': this.interactive,
      'base-list--pulling': this.isPulling,
    }

    const indicatorClasses = {
      'pull-indicator': true,
      'pull-indicator--active': this.isPulling,
      'pull-indicator--threshold': this.pullDistance >= this.pullThreshold,
    }

    const listStyle = this.isPulling
      ? `transform: translateY(${this.pullDistance}px)`
      : ''

    const indicatorStyle = this.isPulling
      ? `transform: translateY(${Math.max(-100 + (this.pullDistance / this.pullThreshold) * 100, -100)}%)`
      : ''

    return html`
      <div class="base-list-wrapper">
        ${this.pullActionIcon ? html`
          <div class=${classMap(indicatorClasses)} style=${indicatorStyle}>
            <span class="pull-indicator__icon">${this.pullActionIcon}</span>
          </div>
        ` : ''}
        <div class=${classMap(listClasses)} role=${this.role} style=${listStyle}>
          <slot></slot>
        </div>
      </div>
    `
  }
}
