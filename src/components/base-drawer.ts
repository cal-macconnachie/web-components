import { html, nothing } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { BaseElement } from '../base-element'
import { appStyles } from '../services/styles'

@customElement('base-drawer')
export class BaseDrawer extends BaseElement {
  // Properties
  @property({ type: Boolean, reflect: true }) open = false
  @property({ type: String, attribute: 'size' }) size: 'sm' | 'md' | 'lg' = 'sm'

  // State
  @state() private isClosing = false
  @state() private isVisible = false
  @state() private isDragging = false
  @state() private dragStartY = 0
  @state() private dragCurrentY = 0
  @state() private dragStartTime = 0
  @state() private lastDragEndTime = 0

  // Refs
  @query('.modal-container') private modalContainer?: HTMLElement
  @query('.modal-body') private modalBody?: HTMLElement

  private transitionDuration = 300

  private boundKeyHandler = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.isVisible) {
      this.handleClose()
    }
  }

  connectedCallback() {
    super.connectedCallback()
    window.addEventListener('keyup', this.boundKeyHandler)
  }

  disconnectedCallback() {
    window.removeEventListener('keyup', this.boundKeyHandler)
    this.unlockBodyScroll()
    super.disconnectedCallback()
  }

  firstUpdated() {
    if (this.open) {
      this.isVisible = true
    }
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('open')) {
      if (this.open) {
        this.isVisible = true
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
    document.body.style.overflow = 'hidden'
  }

  private unlockBodyScroll() {
    document.body.style.overflow = ''
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
    this.lastDragEndTime = 0
    this.dragStartY = 0
    this.dragCurrentY = 0
    this.dragStartTime = 0
  }

  private handleClose = () => {
    if (this.isClosing || !this.isVisible) return

    this.cleanupInlineStyles()
    this.isDragging = false
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
    // Only close when the overlay itself is clicked, allow events inside to bubble
    if (event.target !== event.currentTarget) return
    this.handleClose()
  }

  // Drag handlers
  private handleDragStart = (event: TouchEvent | MouseEvent) => {
    if (!this.modalContainer) return

    // Check if body is scrolled
    if (this.modalBody && this.modalBody.scrollTop > 0) {
      return
    }

    // Allow drag from handle or from content when at top
    const target = event.target as HTMLElement
    const isHandle =
      target.classList.contains('drawer-handle') ||
      target.classList.contains('drawer-handle-bar') ||
      target.closest('.drawer-handle')

    if (!isHandle && this.modalBody && this.modalBody.scrollTop > 0) {
      return
    }

    this.modalContainer.style.transition = ''
    this.modalContainer.style.transform = ''

    this.isDragging = true
    this.dragStartTime = Date.now()

    if (event instanceof TouchEvent) {
      this.dragStartY = event.touches[0].clientY
      this.dragCurrentY = event.touches[0].clientY
    } else {
      this.dragStartY = event.clientY
      this.dragCurrentY = event.clientY
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

    if (dragDistance > 0) {
      event.preventDefault()
      this.modalContainer.style.transform = `translateY(${dragDistance}px)`
      this.modalContainer.style.transition = 'none'
    }
  }

  private handleDragEnd = () => {
    if (!this.isDragging || !this.modalContainer) return

    const dragDistance = Math.max(0, this.dragCurrentY - this.dragStartY)

    if (dragDistance > 5) {
      this.lastDragEndTime = Date.now()
    }

    const dragDuration = Date.now() - this.dragStartTime
    const velocity = dragDistance / dragDuration

    const containerHeight = this.modalContainer.offsetHeight
    const distanceThreshold = Math.max(150, containerHeight * 0.3)
    const velocityThreshold = 0.5

    const shouldClose = dragDistance > distanceThreshold || velocity > velocityThreshold

    // Stop dragging immediately to prevent further drag events
    this.isDragging = false

    const container = this.modalContainer
    const targetPosition = shouldClose ? containerHeight + containerHeight * 0.1 : 0

    // Set starting position immediately
    container.style.transition = 'none'
    container.style.transform = `translateY(${dragDistance}px)`

    // Force reflow
    void container.offsetHeight

    // Start animation on next frame
    requestAnimationFrame(() => {
      container.style.transition = `transform ${this.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
      container.style.transform = `translateY(${targetPosition}px)`
    })

    setTimeout(() => {
      this.dragStartY = 0
      this.dragCurrentY = 0
      this.dragStartTime = 0

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
        // Only clean up styles if staying open
        if (this.modalContainer) {
          this.modalContainer.style.transition = ''
          this.modalContainer.style.transform = ''
        }
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
    this.handleClose()
  }

  // Public methods
  public closeDrawer() {
    this.handleClose()
  }

  public openDrawer() {
    this.open = true
    this.isVisible = true
  }

  render() {
    if (!this.isVisible) {
      return nothing
    }

    const overlayClasses = {
      'modal-overlay': true,
      'modal-overlay--closing': this.isClosing,
    }

    const containerClasses = {
      'modal-container': true,
      'modal-container--drawer': true,
      'modal-container--closing': this.isClosing,
      'modal-container--dragging': this.isDragging,
      [`modal-container--${this.size}`]: true,
    }

    return html`
      <!-- Drawer Overlay -->
      <div
        class=${classMap(overlayClasses)}
        @click=${this.handleOverlayClick}
        @touchstart=${this.handleDragStart}
        @touchmove=${this.handleDragMove}
        @touchend=${this.handleDragEnd}
        @mousedown=${this.handleDragStart}
      >
        <div
          class=${classMap(containerClasses)}
          role="dialog"
          aria-modal="true"
          @mousemove=${this.handleDragMove}
          @mouseup=${this.handleDragEnd}
        >
          <!-- Drawer Handle -->
          <div
            class="drawer-handle"
            @click=${this.handleHandleClick}
            role="button"
            tabindex="0"
            aria-label="Close drawer"
          >
            <div class="drawer-handle-bar"></div>
          </div>

          <!-- Drawer Content Wrapper -->
          <div class="drawer-content drawer-content--${this.size}">
            <slot></slot>
          </div>
        </div>
      </div>
    `
  }

  static styles = appStyles()
}
