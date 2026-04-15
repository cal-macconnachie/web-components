import { css, html } from 'lit'
import { property, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { BaseElement } from '../base-element'
import { register } from '../helpers/register'

type ListItemSize = 'xs' | 'sm' | 'md' | 'lg'

export interface SwipeAction {
  icon: string // Icon name or custom SVG string
  callback: () => void
  color?: string // Background color (use 'transparent' for no background)
  iconColor?: string // Icon color (defaults to currentColor)
  label?: string
  desktopConfig?: {
    showOnHover?: boolean // Whether to show the action button on hover (desktop only)
    hoverChar?: string // Icon to show on hover state, defualts to ⋮
    hoverDelay?: number // Time in ms to wait before showing hover action only relevant if showOnHover is true
  }
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
  @property({ type: Boolean, reflect: true, attribute: 'no-hover' }) noHover = false
  @property({ type: String, attribute: 'role' }) role: string = 'listitem'
  @property({ type: Object, attribute: 'left-swipe-action' }) leftSwipeAction?: SwipeAction
  @property({ type: Object, attribute: 'right-swipe-action' }) rightSwipeAction?: SwipeAction

  @state() private swipeOffset = 0
  @state() private isSwiping = false
  @state() private desktopActionsOpen = false
  @state() private desktopActionSide: 'left' | 'right' | null = null

  private touchStartX = 0
  private touchStartY = 0
  private currentX = 0
  private isDragging = false
  private swipeThreshold = 80
  private documentClickHandler = this.handleDocumentClick.bind(this)
  private leftTimeout: number | null = null
  private rightTimeout: number | null = null

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
      isolation: isolate;
    }

    .swipe-actions {
      position: absolute;
      top: 0;
      bottom: 0;
      display: flex;
      align-items: stretch;
      z-index: 0;
      width: 100px;
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
      cursor: pointer;
      transition: all var(--transition-fast);
      font-family: var(--font-family-sans);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      width: 100%;
    }

    .swipe-action-button:active {
      filter: brightness(0.9);
    }

    /* Desktop plus icons on edges */
    .desktop-plus-icon {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 18px;
      height: 18px;
      border: none;
      border-radius: 50%;
      background: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity var(--transition-fast);
      z-index: 3;
      pointer-events: none;
      font-size: 18px;
      line-height: 1;
      padding: 0;
      color: var(--color-text-muted);
    }

    .desktop-plus-icon::after {
      content: "";
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      cursor: pointer;
    }

    .desktop-plus-icon--left {
      left: -2px;
    }

    .desktop-plus-icon--right {
      right: -2px;
    }

    .desktop-plus-icon:hover {
      filter: brightness(1.1);
    }

    .desktop-plus-icon:active {
      transform: translateY(-50%) scale(0.95);
    }

    .desktop-plus-icon:focus-visible {
      outline: 2px solid var(--color-border-focus);
      outline-offset: 2px;
    }

    /* Show plus icons on hover (desktop only) */
    @media (hover: hover) and (pointer: fine) {
      :host(:hover) .desktop-plus-icon {
        opacity: 0.7;
        pointer-events: auto;
      }

      /* Show swipe actions on desktop when opened */
      .swipe-actions {
        display: flex;
      }

      /* Disable swipe gestures on desktop */
      .base-list-item {
        touch-action: auto;
      }
    }

    /* Hide desktop plus icons on touch devices */
    @media (hover: none) {
      .desktop-plus-icon {
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
      will-change: transform;
    }

    .base-list-item--swiping {
      transition: none;
    }

    .base-list-item--desktop-open {
      transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
    }

    /* Size variants */
    .base-list-item--xs {
      padding: var(--space-1) var(--space-2);
      font-size: var(--font-size-xs);
      line-height: var(--line-height-tight);
    }

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

    /* No hover variant - keeps cursor but removes hover effects */
    .base-list-item--no-hover:hover:not([disabled]) {
      background-color: var(--list-item-bg, var(--color-bg-primary));
    }

    .base-list-item--no-hover:active:not([disabled]) {
      background-color: var(--list-item-bg, var(--color-bg-primary));
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

    // Close desktop actions if open
    if (this.desktopActionsOpen) {
      this.desktopActionsOpen = false
      this.desktopActionSide = null
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

  private renderActionIcon(action: SwipeAction, size: string = '24px') {
    const iconColor = action.iconColor || 'white'

    // Check if icon is a custom SVG (contains < character)
    if (action.icon.includes('<')) {
      return html`<span
        style="display: inline-flex; width: ${size}; height: ${size}; color: ${iconColor};"
        .innerHTML=${action.icon}
      ></span>`
    }

    // base-icon uses --icon-color CSS custom property
    return html`<base-icon
      name=${action.icon}
      size=${size}
      style="--icon-color: ${iconColor};"
    ></base-icon>`
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

    // Close desktop actions after triggering
    this.desktopActionsOpen = false
    this.desktopActionSide = null
  }

  private handleDesktopActionToggle(side: 'left' | 'right', event: Event = {} as Event) {
    if ('preventDefault' in event) {
      event.preventDefault()
    }
    // Don't stop propagation - we need the document click handler to know
    // that the click was inside the component

    if (this.desktopActionsOpen) {
      // Close if already open
      this.desktopActionsOpen = false
      this.desktopActionSide = null
    } else {
      // Open the clicked side
      this.desktopActionsOpen = true
      this.desktopActionSide = side
    }
  }

  private handleDocumentClick(event: Event) {
    // Close desktop actions if clicking outside the component
    const path = event.composedPath()
    if (!path.includes(this)) {
      this.desktopActionsOpen = false
      this.desktopActionSide = null
    }
  }

  connectedCallback() {
    super.connectedCallback()
    document.addEventListener('click', this.documentClickHandler)
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    document.removeEventListener('click', this.documentClickHandler)
  }

  render() {
    const classes = {
      'base-list-item': true,
      [`base-list-item--${this.size}`]: true,
      'base-list-item--interactive': this.interactive,
      'base-list-item--selected': this.selected,
      'base-list-item--swiping': this.isDragging,
      'base-list-item--desktop-open': this.desktopActionsOpen,
      'base-list-item--no-hover': this.noHover,
    }

    // Calculate offset: use desktop actions open state or swipe offset
    let offset = this.swipeOffset
    if (this.desktopActionsOpen && this.desktopActionSide) {
      if (this.desktopActionSide === 'left') {
        offset = 100 // Slide right to reveal left action
      } else {
        offset = -100 // Slide left to reveal right action
      }
    }

    return html`
      <div class="list-item-wrapper">
        ${this.leftSwipeAction
          ? html`
              <div
              class="swipe-actions swipe-actions--left"
              @mouseleave="${() => {
                if (this.desktopActionsOpen && this.leftSwipeAction?.desktopConfig?.showOnHover) {
                  this.desktopActionsOpen = false
                  this.desktopActionSide = null
                }
              }}">
                <button
                  class="swipe-action-button"
                  style="background-color: ${this.leftSwipeAction.color || 'var(--color-success)'}; color: ${this.leftSwipeAction.iconColor || 'white'}"
                  @click=${() => this.triggerSwipeAction(this.leftSwipeAction!)}
                >
                  ${this.renderActionIcon(this.leftSwipeAction, '24px')}
                  ${this.leftSwipeAction.label
                    ? html`<span>${this.leftSwipeAction.label}</span>`
                    : ''}
                </button>
              </div>
            `
          : ''}

        ${this.rightSwipeAction
          ? html`
              <div
              class="swipe-actions swipe-actions--right"
              @mouseleave="${() => {
                if (this.desktopActionsOpen && this.rightSwipeAction?.desktopConfig?.showOnHover) {
                  this.desktopActionsOpen = false
                  this.desktopActionSide = null
                }
              }}"
              >
                <button
                  class="swipe-action-button"
                  style="background-color: ${this.rightSwipeAction.color || 'var(--color-error)'}; color: ${this.rightSwipeAction.iconColor || 'white'}"
                  @click=${() => this.triggerSwipeAction(this.rightSwipeAction!)}
                >
                  ${this.renderActionIcon(this.rightSwipeAction, '24px')}
                  ${this.rightSwipeAction.label
                    ? html`<span>${this.rightSwipeAction.label}</span>`
                    : ''}
                </button>
              </div>
            `
          : ''}

        <!-- Desktop plus icons -->
        ${this.leftSwipeAction && !this.desktopActionsOpen
          ? html`
              <button
                class="desktop-plus-icon desktop-plus-icon--left"
                @click=${(e: Event) => this.handleDesktopActionToggle('left', e)}
                @mouseenter=${() => {
                  // set timout for half a second before handleDesktopActionToggle left
                  if (!this.leftSwipeAction?.desktopConfig?.showOnHover) {
                    return
                  }
                  this.leftTimeout = window.setTimeout((e: Event) => {
                    if (!this.desktopActionsOpen) {
                      this.handleDesktopActionToggle('left', e)
                    }
                  }, this.leftSwipeAction?.desktopConfig?.hoverDelay || 0)
                }}
                @mouseleave=${() => {
                  if (this.leftTimeout && this.leftSwipeAction?.desktopConfig?.showOnHover) {
                    clearTimeout(this.leftTimeout)
                    this.leftTimeout = null
                  }
                }}
                title="Show action"
                aria-label="Show action"
              >
                ${this.leftSwipeAction?.desktopConfig?.hoverChar ?? '⋮'}
              </button>
            `
          : ''}
        ${this.rightSwipeAction && !this.desktopActionsOpen
          ? html`
              <button
                class="desktop-plus-icon desktop-plus-icon--right"
                @click=${(e: Event) => this.handleDesktopActionToggle('right', e)}
                @mouseenter=${() => {
                  if (!this.rightSwipeAction?.desktopConfig?.showOnHover) {
                    return
                  }
                  this.rightTimeout = window.setTimeout((e: Event) => {
                    if (!this.desktopActionsOpen) {
                      this.handleDesktopActionToggle('right', e)
                    }
                  }, this.rightSwipeAction?.desktopConfig?.hoverDelay || 0)
                }}
                @mouseleave=${() => {
                  if (this.rightTimeout && this.rightSwipeAction?.desktopConfig?.showOnHover) {
                    clearTimeout(this.rightTimeout)
                    this.rightTimeout = null
                  }
                }}
                title="Show action"
                aria-label="Show action"
              >
                ${this.rightSwipeAction?.desktopConfig?.hoverChar ?? '⋮'}
              </button>
            `
          : ''}

        <div
          class=${classMap(classes)}
          style="transform: translateX(${offset}px)"
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
