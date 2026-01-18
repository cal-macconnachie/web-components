import { css, html, nothing } from 'lit'
import { property, query, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { BaseElement } from '../base-element'
import { register } from '../helpers/register'

export const registerBaseDrawer = () => register({
  name: 'base-drawer',
  element: BaseDrawer
})
export class BaseDrawer extends BaseElement {
  // Properties
  @property({ type: Boolean, reflect: true }) open = false
  @property({ type: String, attribute: 'size' }) size: 'sm' | 'md' | 'lg' = 'sm'
  @property({
    type: Array,
    converter: {
      fromAttribute: (value: string | null) => {
        if (!value) return [0, 85]
        try {
          return JSON.parse(value)
        } catch {
          return [0, 85]
        }
      }
    }
  })
  detents = [0, 85] // in dvh units
  @property({ type: Boolean, attribute: 'persist-on-overlay-click' }) persistOnOverlayClick = false

  // State
  @state() private isClosing = false
  @state() private isVisible = false
  @state() private isDragging = false
  @state() private dragStartY = 0
  @state() private dragCurrentY = 0
  @state() private dragStartTime = 0
  @state() private lastDragEndTime = 0
  @state() private currentDetentIndex = 0
  @state() private dragCommitted = false

  // Refs
  @query('.modal-container') private modalContainer?: HTMLElement
  @query('.drawer-content') private drawerContent?: HTMLElement

  private transitionDuration = 300

  private boundKeyHandler = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.isVisible && this.isClosable()) {
      this.handleClose()
    }
  }

  connectedCallback() {
    super.connectedCallback()
    window.addEventListener('keyup', this.boundKeyHandler)
  }

  disconnectedCallback() {
    window.removeEventListener('keyup', this.boundKeyHandler)
    window.removeEventListener('mousemove', this.handleDragMove)
    window.removeEventListener('mouseup', this.handleDragEnd)
    this.unlockBodyScroll()
    super.disconnectedCallback()
  }

  firstUpdated() {
    // If drawer is not closable (no 0 detent), it should always be open
    if (!this.isClosable() && !this.open) {
      this.open = true
      return
    }

    if (this.open) {
      this.isVisible = true
      const activeDetents = this.getActiveDetents()
      // If zero detent is not present, start at smallest (first) detent
      // Otherwise start at largest (last) detent
      this.currentDetentIndex = this.isClosable() ? Math.max(0, activeDetents.length - 1) : 0
    }
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('open')) {
      if (this.open) {
        this.isVisible = true
        const activeDetents = this.getActiveDetents()
        // If zero detent is not present, start at smallest (first) detent
        // Otherwise start at largest (last) detent
        this.currentDetentIndex = this.isClosable() ? Math.max(0, activeDetents.length - 1) : 0
        this.lockBodyScroll()
      } else if (this.isVisible) {
        this.handleClose()
      }
    }

    if (changedProperties.has('isVisible')) {
      if (this.isVisible) {
        this.lockBodyScroll()
        this.cleanupInlineStyles()
      } else {
        this.unlockBodyScroll()
        this.resetState()
      }
    }
  }

  private lockBodyScroll() {
    if (!this.persistOnOverlayClick) {
      document.body.style.overflow = 'hidden'
    }
  }

  private unlockBodyScroll() {
    if (!this.persistOnOverlayClick) {
      document.body.style.overflow = ''
    }
  }

  private cleanupInlineStyles() {
    setTimeout(() => {
      if (this.modalContainer) {
        this.modalContainer.style.transition = ''
        this.modalContainer.style.transform = ''
      }
    }, 0)
  }

  private resetState() {
    this.isDragging = false
    this.dragCommitted = false
    this.lastDragEndTime = 0
    this.dragStartY = 0
    this.dragCurrentY = 0
    this.dragStartTime = 0
  }

  private getActiveDetents(): number[] {
    const active = this.detents.filter(d => d > 0).sort((a, b) => a - b)
    return active
  }

  private isClosable(): boolean {
    return this.detents.includes(0)
  }

  private getCurrentDetentHeight(): number {
    const activeDetents = this.getActiveDetents()
    if (activeDetents.length === 0) return 85
    return activeDetents[this.currentDetentIndex] || activeDetents[activeDetents.length - 1]
  }

  private handleClose = () => {
    if (this.isClosing || !this.isVisible) return

    this.cleanupInlineStyles()
    this.isDragging = false
    this.dragCommitted = false
    this.dragStartY = 0
    this.dragCurrentY = 0
    this.dragStartTime = 0

    this.isClosing = true

    setTimeout(() => {
      this.isClosing = false
      this.isVisible = false
      this.open = false

      // Dispatch close event
      this.dispatchEvent(
        new CustomEvent('drawer-close', {
          bubbles: true,
          composed: true,
        })
      )
    }, this.transitionDuration)
  }

  private handleOverlayClick = (event: Event) => {
  if (!this.persistOnOverlayClick && this.isClosable()) {
      // Only close when the overlay itself is clicked, allow events inside to bubble
      if (event.target !== event.currentTarget) return
      this.handleClose()
    }
  }

  // Drag handlers
  private handleDragStart = (event: TouchEvent | MouseEvent) => {
    if (!this.modalContainer) return

    this.modalContainer.style.transition = ''
    this.modalContainer.style.transform = ''

    this.isDragging = true
    this.dragCommitted = false
    this.dragStartTime = Date.now()

    if (event instanceof TouchEvent) {
      this.dragStartY = event.touches[0].clientY
      this.dragCurrentY = event.touches[0].clientY
    } else {
      this.dragStartY = event.clientY
      this.dragCurrentY = event.clientY
      // For mouse events, attach listeners to window so they work even when cursor leaves the handle
      window.addEventListener('mousemove', this.handleDragMove)
      window.addEventListener('mouseup', this.handleDragEnd)
    }
  }

  private handleDragMove = (event: TouchEvent | MouseEvent) => {
    if (!this.isDragging || !this.modalContainer) return

    if (event instanceof TouchEvent) {
      this.dragCurrentY = event.touches[0].clientY
    } else {
      this.dragCurrentY = event.clientY
    }

    const dragDistance = this.dragCurrentY - this.dragStartY

    // Commit to drawer drag after minimal movement
    if (!this.dragCommitted) {
      const absDragDistance = Math.abs(dragDistance)
      if (absDragDistance < 5) {
        return
      }
      this.dragCommitted = true
    }

    event.preventDefault()

    const currentHeight = this.getCurrentDetentHeight()
    const viewportHeight = window.innerHeight

    this.modalContainer.style.transition = 'none'

    if (dragDistance < 0) {
      // Dragging up: increase height, no transform (bottom stays locked to viewport)
      const additionalHeightPx = Math.abs(dragDistance)
      const additionalHeightDvh = (additionalHeightPx / viewportHeight) * 100
      const newHeight = Math.min(100, currentHeight + additionalHeightDvh) // Cap at 100dvh
      this.modalContainer.style.height = `${newHeight}dvh`
      this.modalContainer.style.transform = 'translateY(0)'
    } else {
      // Dragging down: use transform, keep height constant
      this.modalContainer.style.transform = `translateY(${dragDistance}px)`
      this.modalContainer.style.height = `${currentHeight}dvh`
    }
  }

  private handleDragEnd = () => {
    if (!this.isDragging || !this.modalContainer) return

    // Clean up mouse event listeners
    window.removeEventListener('mousemove', this.handleDragMove)
    window.removeEventListener('mouseup', this.handleDragEnd)

    // If we never committed to dragging, just cancel
    if (!this.dragCommitted) {
      this.isDragging = false
      this.dragCommitted = false
      return
    }

    const dragDistance = this.dragCurrentY - this.dragStartY // Can be positive (down) or negative (up)

    if (Math.abs(dragDistance) > 5) {
      this.lastDragEndTime = Date.now()
    }

    const dragDuration = Date.now() - this.dragStartTime
    const velocity = Math.abs(dragDistance) / dragDuration

    // Stop dragging immediately to prevent further drag events
    this.isDragging = false
    this.dragCommitted = false

    const activeDetents = this.getActiveDetents()
    const currentHeight = this.getCurrentDetentHeight()
    const viewportHeight = window.innerHeight

    // Calculate the visual height after drag (in dvh units)
    const dragDistanceSvh = (Math.abs(dragDistance) / viewportHeight) * 100
    let visualHeight: number

    if (dragDistance < 0) {
      // Dragged up = height increased
      visualHeight = currentHeight + dragDistanceSvh
    } else {
      // Dragged down = height decreased (due to translateY)
      visualHeight = currentHeight - dragDistanceSvh
    }

    // Find closest detent or determine if should close
    let targetDetentIndex = this.currentDetentIndex
    const velocityThreshold = 0.5
    const highVelocityThreshold = 1.0

    // Check if closable
    const canClose = this.isClosable()
    const smallestDetent = activeDetents[0]
    const isAtSmallestDetent = this.currentDetentIndex === 0

    // High velocity swipe
    if (velocity > velocityThreshold && Math.abs(dragDistance) > 30) {
      if (dragDistance > 0) {
        // Swiped down fast
        if (canClose) {
          // Very high velocity downward swipe from smallest detent = close
          if (velocity > highVelocityThreshold && isAtSmallestDetent && dragDistance > 50) {
            targetDetentIndex = -1 // Signal to close
          }
          // High velocity downward swipe with visual height below smallest detent = close
          else if (visualHeight < smallestDetent * 0.8) {
            targetDetentIndex = -1 // Signal to close
          }
          // Otherwise move to smaller detent
          else {
            targetDetentIndex = Math.max(0, this.currentDetentIndex - 1)
          }
        } else {
          // Not closable, just move to smaller detent
          targetDetentIndex = Math.max(0, this.currentDetentIndex - 1)
        }
      } else {
        // Swiped up fast - move to larger detent
        targetDetentIndex = Math.min(activeDetents.length - 1, this.currentDetentIndex + 1)
      }
    } else {
      // Low velocity - snap to closest detent
      let closestIndex = 0
      let closestDistance = Math.abs(visualHeight - activeDetents[0])

      for (let i = 1; i < activeDetents.length; i++) {
        const distance = Math.abs(visualHeight - activeDetents[i])
        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = i
        }
      }

      targetDetentIndex = closestIndex

      // More lenient closing threshold
      if (canClose) {
        // If at smallest detent, make it easier to close (only need to drag below 70% of smallest detent)
        if (isAtSmallestDetent && visualHeight < smallestDetent * 0.7) {
          targetDetentIndex = -1 // Signal to close
        }
        // From any detent, if dragged significantly past smallest, close
        else if (visualHeight < smallestDetent - 5) {
          targetDetentIndex = -1 // Signal to close
        }
      }
    }

    const shouldClose = targetDetentIndex < 0

    const container = this.modalContainer
    const targetHeight = shouldClose ? 0 : activeDetents[targetDetentIndex]

    // Set starting state to match what it was during drag
    container.style.transition = 'none'

    if (dragDistance < 0) {
      // Was dragging up: had increased height, no transform
      const startHeight = Math.min(100, visualHeight)
      container.style.height = `${startHeight}dvh`
      container.style.transform = 'translateY(0)'
    } else {
      // Was dragging down: had transform, constant height
      container.style.transform = `translateY(${dragDistance}px)`
      container.style.height = `${currentHeight}dvh`
    }

    // Force reflow
    void container.offsetHeight

    // Animate to target state
    requestAnimationFrame(() => {
      if (shouldClose) {
        // Animate drawer closing
        container.style.transition = `transform ${this.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
        container.style.transform = `translateY(100%)`
      } else {
        // Animate to target detent: transform to 0 and height to target
        container.style.transition = `transform ${this.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1), height ${this.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
        container.style.transform = 'translateY(0)'
        container.style.height = `${targetHeight}dvh`
      }
    })

    setTimeout(() => {
      this.dragStartY = 0
      this.dragCurrentY = 0
      this.dragStartTime = 0
      this.dragCommitted = false

      if (shouldClose) {
        this.isVisible = false
        this.open = false

        // Dispatch close event
        this.dispatchEvent(
          new CustomEvent('drawer-close', {
            bubbles: true,
            composed: true,
          })
        )
      } else {
        // Update the detent index
        this.currentDetentIndex = targetDetentIndex

        // Clean up inline styles - keep height at target value, don't clear it
        if (this.modalContainer) {
          this.modalContainer.style.transition = ''
          this.modalContainer.style.transform = ''
          this.modalContainer.style.height = `${targetHeight}dvh`
        }

        // Dispatch detent change event
        this.dispatchEvent(
          new CustomEvent('drawer-detent-change', {
            bubbles: true,
            composed: true,
            detail: {
              detentIndex: this.currentDetentIndex,
              detentHeight: activeDetents[this.currentDetentIndex]
            }
          })
        )
      }
    }, this.transitionDuration)
  }

  private handleHandleClick = (event: MouseEvent) => {
    const timeSinceLastDrag = Date.now() - this.lastDragEndTime
    if (timeSinceLastDrag < 200) {
      event.preventDefault()
      event.stopPropagation()
      return
    }
    if (this.isClosable()) {
      this.handleClose()
    }
  }

  // Public methods
  public closeDrawer() {
    this.handleClose()
  }

  public openDrawer() {
    this.open = true
    this.isVisible = true
    const activeDetents = this.getActiveDetents()
    // If zero detent is not present, start at smallest (first) detent
    // Otherwise start at largest (last) detent
    this.currentDetentIndex = this.isClosable() ? Math.max(0, activeDetents.length - 1) : 0
    this.dispatchEvent(
      new CustomEvent('drawer-open', {
        bubbles: true,
        composed: true,
      })
    )
  }

  public setDetent(index: number, animated: boolean = true) {
    const activeDetents = this.getActiveDetents()
    if (index < 0 || index >= activeDetents.length) {
      console.warn(`Invalid detent index: ${index}. Valid range is 0-${activeDetents.length - 1}`)
      return
    }

    if (!animated || !this.modalContainer) {
      this.currentDetentIndex = index
      this.dispatchEvent(
        new CustomEvent('drawer-detent-change', {
          bubbles: true,
          composed: true,
          detail: {
            detentIndex: this.currentDetentIndex,
            detentHeight: activeDetents[this.currentDetentIndex]
          }
        })
      )
      return
    }

    // Animated transition
    const currentHeight = this.getCurrentDetentHeight()
    const targetHeight = activeDetents[index]

    if (currentHeight === targetHeight) return

    const container = this.modalContainer

    // Set current height explicitly
    container.style.height = `${currentHeight}dvh`
    container.style.transition = 'none'

    // Force reflow
    void container.offsetHeight

    // Start animation
    requestAnimationFrame(() => {
      container.style.transition = `height ${this.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
      container.style.height = `${targetHeight}dvh`
    })

    setTimeout(() => {
      this.currentDetentIndex = index

      // Clean up styles - keep height at target value
      if (this.modalContainer) {
        this.modalContainer.style.transition = ''
        this.modalContainer.style.height = `${targetHeight}dvh`
      }

      this.dispatchEvent(
        new CustomEvent('drawer-detent-change', {
          bubbles: true,
          composed: true,
          detail: {
            detentIndex: this.currentDetentIndex,
            detentHeight: activeDetents[this.currentDetentIndex]
          }
        })
      )
    }, this.transitionDuration)
  }

  render() {
    if (!this.isVisible) {
      return nothing
    }

    const overlayClasses = {
      'modal-overlay': true,
      'modal-overlay--closing': this.isClosing,
      'modal-overlay--passthrough': this.persistOnOverlayClick,
    }

    const containerClasses = {
      'modal-container': true,
      'modal-container--drawer': true,
      'modal-container--closing': this.isClosing,
      'modal-container--dragging': this.isDragging,
      [`modal-container--${this.size}`]: true,
    }

    const currentHeight = this.getCurrentDetentHeight()
    const activeDetents = this.getActiveDetents()
    const showHandle = this.isClosable() || activeDetents.length > 1

    return html`
      <!-- Drawer Overlay -->
      <div
        class=${classMap(overlayClasses)}
        @click=${this.handleOverlayClick}
      >
        <div
          class=${classMap(containerClasses)}
          style="height: ${currentHeight}dvh"
          role="dialog"
          aria-modal="true"
        >
          <!-- Drawer Handle -->
          ${showHandle ? html`
            <div
              class="drawer-handle"
              @click=${this.handleHandleClick}
              @touchstart=${this.handleDragStart}
              @touchmove=${this.handleDragMove}
              @touchend=${this.handleDragEnd}
              @mousedown=${this.handleDragStart}
              role="button"
              tabindex="0"
              aria-label="Close drawer"
            >
              <div class="drawer-handle-bar"></div>
            </div>
          ` : nothing}

          <!-- Drawer Content Wrapper -->
          <div class="drawer-content drawer-content--${this.size}">
            <slot></slot>
          </div>
        </div>
      </div>
    `
  }

  static styles = css`
  :host {
      --transition-slow: 300ms;
    }

    /* Body scroll lock */
    :host(.modal-open) {
      overflow: hidden;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: flex-end;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: none;
      animation: fadeIn 0.2s ease-out;
    }

    .modal-overlay--closing {
      animation: fadeOut var(--transition-slow) ease-out forwards;
    }

    .modal-overlay--passthrough {
      background: transparent;
      pointer-events: none;
    }
    .modal-overlay--passthrough .modal-container {
      pointer-events: auto;
    }

    .modal-container {
      background: var(--color-bg-primary);
      border-top-left-radius: var(--radius-xl);
      border-top-right-radius: var(--radius-xl);
      box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06);
      width: 100vw;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: slideUp var(--transition-slow);
      transform-origin: bottom center;
      transition: height var(--transition-slow) cubic-bezier(0.4, 0, 0.2, 1);
    }

    .modal-container--closing {
      animation: slideDown var(--transition-slow);
    }

    .modal-container--dragging {
      user-select: none;
      -webkit-user-select: none;
      cursor: grabbing;
    }

    .drawer-handle {
      display: flex;
      justify-content: center;
      padding-top: var(--space-3);
      padding-bottom: var(--space-2);
      flex-shrink: 0;
      cursor: pointer;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }

    .drawer-handle:hover .drawer-handle-bar {
      opacity: 0.7;
    }

    .drawer-handle-bar {
      width: 36px;
      height: 5px;
      background: var(--color-text-muted);
      border-radius: 100px;
      opacity: 0.5;
      transition: opacity var(--transition-slow) ease;
    }

    .drawer-content {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      height: 100%;
    }

    .drawer-content--sm {
      max-width: 400px;
    }

    .drawer-content--md {
      max-width: 600px;
    }

    .drawer-content--lg {
      max-width: 900px;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes fadeOut {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }

    @keyframes slideUp {
      from {
        transform: translateY(100%);
      }
      to {
        transform: translateY(0);
      }
    }

    @keyframes slideDown {
      from {
        transform: translateY(0);
      }
      to {
        transform: translateY(100%);
      }
    }

    @media (max-width: 640px) {
      .modal-container {
        padding-bottom: env(safe-area-inset-bottom);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      * {
        animation: none !important;
        transition: none !important;
      }
    }`
}
