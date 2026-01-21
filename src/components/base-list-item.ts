import { css, html } from 'lit'
import { property, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { BaseElement } from '../base-element'
import { register } from '../helpers/register'

type ListItemSize = 'sm' | 'md' | 'lg'

export interface SwipeAction {
  icon: string
  callback: () => void
  color?: string
  label?: string
}

export const registerBaseListItem = () => register({
  name: 'base-list-item',
  element: BaseListItem
})

export class BaseListItem extends BaseElement {
  @property({ type: String, attribute: 'size' }) size: ListItemSize = 'md'
  @property({ type: Boolean, reflect: true, attribute: 'disabled' }) disabled = false
  @property({ type: Boolean, reflect: true, attribute: 'selected' }) selected = false
  @property({ type: Boolean, reflect: true, attribute: 'interactive' }) interactive = false
  @property({ type: String, attribute: 'role' }) role: string = 'listitem'
  @property({ type: Object, attribute: 'left-swipe-action' }) leftSwipeAction?: SwipeAction
  @property({ type: Object, attribute: 'right-swipe-action' }) rightSwipeAction?: SwipeAction

  @state() private swipeOffset = 0
  @state() private isSwiping = false

  private touchStartX = 0
  private touchStartY = 0
  private currentX = 0
  private isDragging = false
  private swipeThreshold = 80

  static styles = css`
    :host {
      display: block;
      width: 100%;
      position: relative;
      overflow: hidden;
    }

    :host([disabled]) {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }

    .list-item-wrapper {
      position: relative;
      width: 100%;
      display: flex;
      align-items: stretch;
    }

    .swipe-actions {
      position: absolute;
      top: 0;
      bottom: 0;
      display: flex;
      align-items: stretch;
      z-index: 0;
    }

    .swipe-actions--left {
      left: 0;
      right: auto;
    }

    .swipe-actions--right {
      right: 0;
      left: auto;
    }

    .swipe-action-button {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-1);
      padding: 0 var(--space-6);
      border: none;
      color: white;
      cursor: pointer;
      transition: all var(--transition-fast);
      font-family: var(--font-family-sans);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      min-width: 80px;
    }

    .swipe-action-button:active {
      filter: brightness(0.9);
    }

    /* Desktop hover actions */
    .desktop-actions {
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      gap: var(--space-1);
      padding-right: var(--space-3);
      opacity: 0;
      transform: translateX(10px);
      transition: all var(--transition-fast);
      pointer-events: none;
      z-index: 2;
      padding-left: var(--space-8);
    }

    .desktop-action-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition-fast);
      color: white;
      pointer-events: auto;
    }

    .desktop-action-button:hover {
      transform: scale(1.1);
      filter: brightness(1.1);
    }

    .desktop-action-button:active {
      transform: scale(0.95);
    }

    .desktop-action-button:focus-visible {
      outline: 2px solid var(--color-border-focus);
      outline-offset: 2px;
    }

    /* Show desktop actions on hover (desktop only) */
    @media (hover: hover) and (pointer: fine) {
      :host(:hover) .desktop-actions,
      :host(:focus-within) .desktop-actions {
        opacity: 1;
        transform: translateX(0);
        pointer-events: auto;
      }

      /* Hide swipe actions on desktop */
      .swipe-actions {
        display: none;
      }
    }

    /* Hide desktop actions on touch devices */
    @media (hover: none) {
      .desktop-actions {
        display: none;
      }
    }

    .base-list-item {
      position: relative;
      display: block;
      width: 100%;
      font-family: var(--font-family-sans);
      color: var(--color-text-primary);
      background-color: var(--list-item-bg, var(--color-bg-primary));
      border: none;
      text-align: left;
      box-sizing: border-box;
      z-index: 1;
      touch-action: pan-y;
      transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
    }

    .base-list-item--swiping {
      transition: none;
    }

    /* Size variants */
    .base-list-item--sm {
      padding: var(--space-2) var(--space-3);
      font-size: var(--font-size-sm);
      line-height: var(--line-height-tight);
    }

    .base-list-item--md {
      padding: var(--space-3) var(--space-4);
      font-size: var(--font-size-base);
      line-height: var(--line-height-normal);
    }

    .base-list-item--lg {
      padding: var(--space-4) var(--space-5);
      font-size: var(--font-size-lg);
      line-height: var(--line-height-relaxed);
    }

    /* Interactive state */
    .base-list-item--interactive {
      cursor: pointer;
    }

    .base-list-item--interactive:hover:not([disabled]) {
      background-color: var(--color-bg-muted);
    }

    .base-list-item--interactive:active:not([disabled]) {
      background-color: var(--color-bg-secondary, var(--color-bg-muted));
    }

    .base-list-item--interactive:focus-visible {
      outline: 2px solid var(--color-border-focus);
      outline-offset: -2px;
    }

    /* Selected state */
    .base-list-item--selected {
      background-color: var(--color-primary-light);
      color: var(--color-primary);
      font-weight: var(--font-weight-medium);
    }

    .base-list-item--selected:hover:not([disabled]) {
      background-color: var(--color-primary-light);
    }
  `

  private handleClick(event: MouseEvent) {
    if (this.disabled || this.isDragging) {
      event.preventDefault()
      event.stopPropagation()
      return
    }

    this.dispatchEvent(
      new CustomEvent('item-click', {
        detail: { item: this },
        bubbles: true,
        composed: true,
      })
    )
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (this.disabled) {
      return
    }

    // Handle Enter and Space keys for accessibility
    if (this.interactive && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      this.handleClick(event as any)
    }
  }

  private handleTouchStart(event: TouchEvent) {
    if (this.disabled || (!this.leftSwipeAction && !this.rightSwipeAction)) {
      return
    }

    const touch = event.touches[0]
    this.touchStartX = touch.clientX
    this.touchStartY = touch.clientY
    this.currentX = touch.clientX
    this.isDragging = false
    this.isSwiping = true
  }

  private handleTouchMove(event: TouchEvent) {
    if (!this.isSwiping || this.disabled) {
      return
    }

    const touch = event.touches[0]
    const deltaX = touch.clientX - this.touchStartX
    const deltaY = touch.clientY - this.touchStartY

    // Determine if this is a horizontal or vertical swipe
    if (!this.isDragging && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 5) {
      this.isDragging = true
    }

    if (this.isDragging) {
      event.preventDefault()
      this.currentX = touch.clientX

      // Only allow swipe in the direction where an action exists
      let offset = deltaX
      if (offset > 0 && !this.leftSwipeAction) {
        offset = 0
      }
      if (offset < 0 && !this.rightSwipeAction) {
        offset = 0
      }

      // Add resistance at the edges
      const maxSwipe = 120
      if (Math.abs(offset) > maxSwipe) {
        const excess = Math.abs(offset) - maxSwipe
        offset = offset > 0
          ? maxSwipe + excess * 0.2
          : -(maxSwipe + excess * 0.2)
      }

      this.swipeOffset = offset
    }
  }

  private handleTouchEnd() {
    if (!this.isSwiping || this.disabled) {
      return
    }

    const deltaX = this.currentX - this.touchStartX

    // Check if swipe threshold was met
    if (Math.abs(deltaX) >= this.swipeThreshold) {
      if (deltaX > 0 && this.leftSwipeAction) {
        // Swiped right - trigger left action
        this.triggerSwipeAction(this.leftSwipeAction)
      } else if (deltaX < 0 && this.rightSwipeAction) {
        // Swiped left - trigger right action
        this.triggerSwipeAction(this.rightSwipeAction)
      }
    }

    // Stop dragging to enable transition, then reset position
    this.isDragging = false
    this.isSwiping = false

    // Wait for the next frame to ensure transition is applied before resetting offset
    requestAnimationFrame(() => {
      this.swipeOffset = 0
    })
  }

  private triggerSwipeAction(action: SwipeAction) {
    // Trigger the callback
    action.callback()

    // Dispatch custom event
    this.dispatchEvent(
      new CustomEvent('swipe-action', {
        detail: { action },
        bubbles: true,
        composed: true,
      })
    )
  }

  render() {
    const classes = {
      'base-list-item': true,
      [`base-list-item--${this.size}`]: true,
      'base-list-item--interactive': this.interactive,
      'base-list-item--selected': this.selected,
      'base-list-item--swiping': this.isDragging,
    }

    return html`
      <div class="list-item-wrapper">
        ${this.leftSwipeAction
          ? html`
              <div class="swipe-actions swipe-actions--left">
                <button
                  class="swipe-action-button"
                  style="background-color: ${this.leftSwipeAction.color || 'var(--color-success)'}"
                  @click=${() => this.triggerSwipeAction(this.leftSwipeAction!)}
                >
                  <base-icon
                    name=${this.leftSwipeAction.icon}
                    size="24px"
                    color="white"
                  ></base-icon>
                  ${this.leftSwipeAction.label
                    ? html`<span>${this.leftSwipeAction.label}</span>`
                    : ''}
                </button>
              </div>
            `
          : ''}

        ${this.rightSwipeAction
          ? html`
              <div class="swipe-actions swipe-actions--right">
                <button
                  class="swipe-action-button"
                  style="background-color: ${this.rightSwipeAction.color || 'var(--color-error)'}"
                  @click=${() => this.triggerSwipeAction(this.rightSwipeAction!)}
                >
                  <base-icon
                    name=${this.rightSwipeAction.icon}
                    size="24px"
                    color="white"
                  ></base-icon>
                  ${this.rightSwipeAction.label
                    ? html`<span>${this.rightSwipeAction.label}</span>`
                    : ''}
                </button>
              </div>
            `
          : ''}

        <!-- Desktop hover actions -->
        ${this.leftSwipeAction || this.rightSwipeAction
          ? html`
              <div class="desktop-actions">
                ${this.leftSwipeAction
                  ? html`
                      <button
                        class="desktop-action-button"
                        style="background-color: ${this.leftSwipeAction.color || 'var(--color-success)'}"
                        @click=${(e: Event) => {
                          e.stopPropagation()
                          this.triggerSwipeAction(this.leftSwipeAction!)
                        }}
                        title=${this.leftSwipeAction.label || ''}
                        aria-label=${this.leftSwipeAction.label || ''}
                      >
                        <base-icon
                          name=${this.leftSwipeAction.icon}
                          size="20px"
                          color="white"
                        ></base-icon>
                      </button>
                    `
                  : ''}
                ${this.rightSwipeAction
                  ? html`
                      <button
                        class="desktop-action-button"
                        style="background-color: ${this.rightSwipeAction.color || 'var(--color-error)'}"
                        @click=${(e: Event) => {
                          e.stopPropagation()
                          this.triggerSwipeAction(this.rightSwipeAction!)
                        }}
                        title=${this.rightSwipeAction.label || ''}
                        aria-label=${this.rightSwipeAction.label || ''}
                      >
                        <base-icon
                          name=${this.rightSwipeAction.icon}
                          size="20px"
                          color="white"
                        ></base-icon>
                      </button>
                    `
                  : ''}
              </div>
            `
          : ''}

        <div
          class=${classMap(classes)}
          style="transform: translateX(${this.swipeOffset}px)"
          role=${this.role}
          tabindex=${this.interactive && !this.disabled ? '0' : '-1'}
          aria-selected=${this.selected ? 'true' : 'false'}
          aria-disabled=${this.disabled ? 'true' : 'false'}
          @click=${this.handleClick}
          @keydown=${this.handleKeyDown}
          @touchstart=${this.handleTouchStart}
          @touchmove=${this.handleTouchMove}
          @touchend=${this.handleTouchEnd}
          @touchcancel=${this.handleTouchEnd}
        >
          <slot></slot>
        </div>
      </div>
    `
  }
}
