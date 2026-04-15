import { css, html } from 'lit'
import { property } from 'lit/decorators.js'
import { BaseElement } from '../base-element'
import { register } from '../helpers/register'

type ToastVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
type ToastPadding = 'none' | 'sm' | 'md' | 'lg'
type DismissPeriod = `${number}${'s' | 'ms'}`
type DismissBehavior = 'manual' | DismissPeriod
type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
export const registerBaseToast = () => register({
  name: 'base-toast',
  element: BaseToast
})
export class BaseToast extends BaseElement {
  @property({ type: String, attribute: 'variant', reflect: true }) variant: ToastVariant = 'default'
  @property({ type: String, attribute: 'padding', reflect: true }) padding: ToastPadding = 'sm'
  @property({ type: String, attribute: 'size', reflect: true }) size: 'xs' | 'sm' | 'md' | 'lg' = 'sm'
  @property({ type: String, attribute: 'dismiss', reflect: true }) dismiss: DismissBehavior = '2s'
  @property({ type: String, attribute: 'position', reflect: true }) position: ToastPosition = 'bottom-center'

  connectedCallback() {
    super.connectedCallback()
    // move host to end of body to avoid z-index and overflow issues
    if (this.parentElement !== document.body) {
      document.body.appendChild(this)
    }
  }
  private timerStarted: number = 0
  private timerPausedAt: number = 0
  private toastTimout: any = null
  private pauseTimer() {
    this.timerPausedAt = Date.now()
    clearTimeout(this.toastTimout)
    this.style.animationPlayState = 'paused'
    const shadowContainer = this.shadowRoot?.querySelector('.toast-container') as HTMLElement
    if (shadowContainer) {
      shadowContainer.style.animationPlayState = 'paused'
    }
    const progressBar = this.shadowRoot?.querySelector('.toast-progress') as HTMLElement
    if (progressBar) {
      progressBar.style.animationPlayState = 'paused'
    }
  }
  private resumeTimer() {
    const elapsed = this.timerPausedAt - this.timerStarted
    const timeValue = parseInt(this.dismiss)
    const timeUnit = this.dismiss.replace(timeValue.toString(), '')
    let timeoutDuration = 0

    if (timeUnit === 's') {
      timeoutDuration = timeValue * 1000
    } else if (timeUnit === 'ms') {
      timeoutDuration = timeValue
    }

    const remainingTime = timeoutDuration - elapsed

    this.timerStarted = Date.now()
    this.toastTimout = setTimeout(() => {
      this.hide()
    }, remainingTime)
    this.style.animationPlayState = 'running'
    const shadowContainer = this.shadowRoot?.querySelector('.toast-container') as HTMLElement
    if (shadowContainer) {
      shadowContainer.style.animationPlayState = 'running'
    }
    const progressBar = this.shadowRoot?.querySelector('.toast-progress') as HTMLElement
    if (progressBar) {
      progressBar.style.animationPlayState = 'running'
    }
  }
  show() {
    this.timerStarted = Date.now()
    this.classList.remove('hide')

    // Trigger reflow to ensure animation plays
    void this.offsetWidth

    this.classList.add('show')

    if (this.dismiss !== 'manual') {
      const timeValue = parseInt(this.dismiss)
      const timeUnit = this.dismiss.replace(timeValue.toString(), '')
      let timeoutDuration = 0
      this.addEventListener('mouseenter', this.pauseTimer.bind(this))
      this.addEventListener('mouseleave', this.resumeTimer.bind(this))

      if (timeUnit === 's') {
        timeoutDuration = timeValue * 1000
      } else if (timeUnit === 'ms') {
        timeoutDuration = timeValue
      }

      // Set CSS variable for progress bar animation duration
      this.style.setProperty('--toast-duration', `${timeoutDuration}ms`)

      this.toastTimout = setTimeout(() => {
        this.hide()
      }, timeoutDuration)
    }
    this.dispatchEvent(
      new CustomEvent('toast-shown', {
        detail: { toast: this },
        bubbles: true,
        composed: true,
      })
    )
  }

  hide(): void {
    this.classList.remove('show')
    this.classList.add('hide')
    this.toastTimout && clearTimeout(this.toastTimout)
    this.removeEventListener('mouseenter', this.pauseTimer.bind(this))
    this.removeEventListener('mouseleave', this.resumeTimer.bind(this))
    this.dispatchEvent(
      new CustomEvent('toast-hidden', {
        detail: { toast: this },
        bubbles: true,
        composed: true,
      })
    )
  }

  static styles = css`
    :host {
      position: fixed;
      display: flex;
      z-index: var(--z-toast);
      justify-content: center;
      width: auto;
      max-width: 100%;
      box-sizing: border-box;
      opacity: 0;
      pointer-events: none;
    }

    :host(.show) {
      pointer-events: auto;
    }

    /* Position variants */
    :host([position="top-left"]) {
      top: var(--space-6);
      left: var(--space-6);
    }

    :host([position="top-center"]) {
      top: var(--space-6);
      left: 50%;
      transform: translateX(-50%);
    }

    :host([position="top-right"]) {
      top: var(--space-6);
      right: var(--space-6);
    }

    :host([position="bottom-left"]) {
      bottom: var(--space-6);
      left: var(--space-6);
    }

    :host([position="bottom-center"]) {
      bottom: var(--space-6);
      left: 50%;
      transform: translateX(-50%);
    }

    :host([position="bottom-right"]) {
      bottom: var(--space-6);
      right: var(--space-6);
    }

    /* Slide-in animations */
    @keyframes slideInFromTop {
      from {
        opacity: 0;
        transform: translateY(-100%);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes slideInFromTopCenter {
      from {
        opacity: 0;
        transform: translate(-50%, -100%);
      }
      to {
        opacity: 1;
        transform: translate(-50%, 0);
      }
    }

    @keyframes slideInFromBottom {
      from {
        opacity: 0;
        transform: translateY(100%);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes slideInFromBottomCenter {
      from {
        opacity: 0;
        transform: translate(-50%, 100%);
      }
      to {
        opacity: 1;
        transform: translate(-50%, 0);
      }
    }

    @keyframes slideInFromLeft {
      from {
        opacity: 0;
        transform: translateX(-100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes slideInFromRight {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    /* Animation classes for showing */
    :host(.show[position="top-left"]) {
      animation: slideInFromTop 0.3s ease-out forwards;
    }

    :host(.show[position="top-center"]) {
      animation: slideInFromTopCenter 0.3s ease-out forwards;
    }

    :host(.show[position="top-right"]) {
      animation: slideInFromTop 0.3s ease-out forwards;
    }

    :host(.show[position="bottom-left"]) {
      animation: slideInFromBottom 0.3s ease-out forwards;
    }

    :host(.show[position="bottom-center"]) {
      animation: slideInFromBottomCenter 0.3s ease-out forwards;
    }

    :host(.show[position="bottom-right"]) {
      animation: slideInFromBottom 0.3s ease-out forwards;
    }

    /* Slide-out animations */
    @keyframes slideOutToTop {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(-100%);
      }
    }

    @keyframes slideOutToTopCenter {
      from {
        opacity: 1;
        transform: translate(-50%, 0);
      }
      to {
        opacity: 0;
        transform: translate(-50%, -100%);
      }
    }

    @keyframes slideOutToBottom {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(100%);
      }
    }

    @keyframes slideOutToBottomCenter {
      from {
        opacity: 1;
        transform: translate(-50%, 0);
      }
      to {
        opacity: 0;
        transform: translate(-50%, 100%);
      }
    }

    @keyframes slideOutToLeft {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(-100%);
      }
    }

    @keyframes slideOutToRight {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(100%);
      }
    }

    /* Animation classes for hiding */
    :host(.hide[position="top-left"]) {
      animation: slideOutToTop 0.3s ease-in forwards;
    }

    :host(.hide[position="top-center"]) {
      animation: slideOutToTopCenter 0.3s ease-in forwards;
    }

    :host(.hide[position="top-right"]) {
      animation: slideOutToTop 0.3s ease-in forwards;
    }

    :host(.hide[position="bottom-left"]) {
      animation: slideOutToBottom 0.3s ease-in forwards;
    }

    :host(.hide[position="bottom-center"]) {
      animation: slideOutToBottomCenter 0.3s ease-in forwards;
    }

    :host(.hide[position="bottom-right"]) {
      animation: slideOutToBottom 0.3s ease-in forwards;
    }

    .toast-container {
      background-color: var(--color-bg-primary);
      color: var(--color-text-primary);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-md);
      display: flex;
      align-items: center;
      box-sizing: border-box;
      max-width: 100%;
      transition: all 0.3s ease-in-out;
      position: relative;
      overflow: hidden;
    }

    .toast-container:hover {
      box-shadow: var(--shadow-lg);
    }

    .toast-progress {
      position: absolute;
      top: 0;
      left: 0;
      height: 3px;
      background-color: currentColor;
      opacity: 0.15;
      width: 100%;
      transform-origin: left;
    }

    :host(.show) .toast-progress {
      animation: progressShrink var(--toast-duration, 2s) linear forwards;
    }

    :host(.hide) .toast-progress {
      opacity: 0;
    }

    @keyframes progressShrink {
      from {
        transform: scaleX(1);
      }
      to {
        transform: scaleX(0);
      }
    }

    .toast-dismiss-btn {
      background: none;
      border: none;
      font-size: var(--font-size-lg);
      color: var(--color-text-inverse);
      cursor: pointer;
      margin-left: var(--space-4);
    }

    .toast-dismiss-btn.default {
      color: var(--color-text-muted);
    }

    .toast-dismiss-btn:hover {
      color: var(--color-text-primary);
    }
    /* Variant styles */
    .toast-container.default {
      background-color: var(--color-bg-muted);
      color: var(--color-text-primary);
    }
    .toast-container.primary {
      background-color: var(--color-primary);
      color: var(--color-text-inverse);
    }
    .toast-container.success {
      background-color: var(--color-success);
      color: var(--color-text-inverse);
    }
    .toast-container.warning {
      background-color: var(--color-warning);
      color: var(--color-text-inverse);
    }
    .toast-container.danger {
      background-color: var(--color-error);
      color: var(--color-text-inverse);
    }
    .toast-container.info {
      background-color: var(--color-info);
      color: var(--color-text-inverse);
    }

    /* Padding variants */
    :host([padding="auto"]) .toast-container {
      padding: auto;
    }
    :host([padding="none"]) .toast-container {
      padding: 0;
    }
    :host([padding="sm"]) .toast-container {
      padding: var(--space-3) var(--space-4);
    }
    :host([padding="md"]) .toast-container {
      padding: var(--space-4) var(--space-6);
    }
    :host([padding="lg"]) .toast-container {
      padding: var(--space-6) var(--space-8);
    }

    /* Size variants */
    :host([size="xs"]) .toast-container {
      font-size: var(--font-size-xs);
    }
    :host([size="sm"]) .toast-container {
      font-size: var(--font-size-sm);
    }
    :host([size="md"]) .toast-container {
      font-size: var(--font-size-base);
    }
    :host([size="lg"]) .toast-container {
      font-size: var(--font-size-lg);
    }
  `

  render () {
    return html`
      <div class="toast-container ${this.variant}">
        ${
          this.dismiss !== 'manual' ? html`
            <div class="toast-progress"></div>
          ` : ''
        }
        <slot></slot>
        ${
          this.dismiss === 'manual' ? html`
            <button
              class="toast-dismiss-btn ${this.variant}"
              aria-label="Dismiss toast"
              @click=${() => this.hide()}
            >
              &times;
            </button>
          ` : ''
        }
      </div>
    `
  }
}

export function showToast({
  message,
  variant = 'default',
  position = 'bottom-center',
  dismiss = '2s'} : {
    message: string,
    variant?: ToastVariant,
    position?: ToastPosition,
    dismiss?: DismissBehavior
  }) {
  const toast = document.createElement('base-toast') as BaseToast;
  toast.id = `toast-${Date.now()}`;
  toast.setAttribute('id', toast.id);
  toast.setAttribute('variant', variant);
  toast.setAttribute('position', position);
  toast.setAttribute('dismiss', dismiss);
  toast.textContent = message;
  document.body.appendChild(toast);
  toast.show();
  toast.addEventListener('toast-hidden', () => {
    setTimeout(() => {
    document.getElementById(toast.id)?.remove();
    }, 300); // Wait for hide animation to finish
  });
}
