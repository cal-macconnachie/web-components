import { css, html } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { BaseElement } from '../base-element'

type TimePickerSize = 'sm' | 'md' | 'lg'
type TimeFormat = '12' | '24'

@customElement('base-time-picker')
export class BaseTimePicker extends BaseElement {
  @property({ type: String }) value = ''
  @property({ type: String }) label?: string
  @property({ type: String }) placeholder = 'Select a time'
  @property({ type: Boolean, reflect: true }) required = false
  @property({ type: Boolean, reflect: true }) disabled = false
  @property({ type: String }) error?: string
  @property({ type: String }) hint?: string
  @property({ type: String }) size: TimePickerSize = 'md'
  @property({ type: String }) format: TimeFormat = '12'

  @state() private isOpen = false
  @state() private selectedHour = 12
  @state() private selectedMinute = 0
  @state() private selectedPeriod: 'AM' | 'PM' = 'AM'
  @state() private isFlipped = false

  @query('.time-display') private timeDisplay!: HTMLDivElement
  @query('.time-container') private timeContainer?: HTMLDivElement

  private inputId = `time-picker-${Math.random().toString(36).substr(2, 9)}`

  static styles = css`
    :host {
      display: block;
      position: relative;
    }

    .time-picker-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .time-picker-label {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
      line-height: var(--line-height-tight);
    }

    .required-indicator {
      color: var(--color-error);
      font-weight: var(--font-weight-bold);
    }

    .time-wrapper {
      position: relative;
    }

    .time-display {
      width: 100%;
      font-family: var(--font-family-sans);
      background-color: var(--color-bg-primary);
      border: var(--picker-display-border, 1px solid var(--color-border));
      border-radius: var(--picker-display-border-radius, var(--radius-md));
      transition: all var(--transition-fast);
      color: var(--color-text-primary);
      cursor: pointer;
      user-select: none;
      display: flex;
      align-items: center;
      box-sizing: border-box;
    }

    .time-display:hover:not(.time-disabled) {
      border-color: var(--picker-display-border-color-hover, var(--color-border-hover));
    }

    .time-display--open {
      border-color: var(--picker-display-border-color-focus, var(--color-border-focus));
      box-shadow: var(--picker-display-box-shadow, 0 0 0 3px rgba(59, 130, 246, 0.1));
    }

    .time-display--empty {
      color: var(--color-text-muted);
    }

    /* Sizes */
    .time-picker--sm .time-display {
      padding: var(--space-2) var(--space-3);
      padding-right: var(--space-8);
      font-size: var(--font-size-sm);
    }

    .time-picker--md .time-display {
      padding: var(--space-3) var(--space-4);
      padding-right: var(--space-10);
      font-size: var(--font-size-base);
    }

    .time-picker--lg .time-display {
      padding: var(--space-4) var(--space-5);
      padding-right: var(--space-12);
      font-size: var(--font-size-lg);
    }

    /* States */
    .time-picker--error .time-display {
      border-color: var(--color-error);
    }

    .time-picker--error .time-display--open {
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }

    .time-disabled {
      opacity: 0.5;
      cursor: not-allowed !important;
      background-color: var(--color-bg-muted);
    }

    .time-icon {
      position: absolute;
      right: var(--space-3);
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-text-secondary);
      pointer-events: none;
    }

    .time-icon svg {
      width: 1.25em;
      height: 1.25em;
      display: block;
    }

    /* Time Picker Dropdown */
    .time-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 999;
      background: transparent;
    }

    .time-container {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      min-width: 200px;
      background: var(--color-bg-primary);
      border: 1px solid var(--color-border-focus);
      border-radius: var(--radius-md);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      z-index: 1000;
      padding: var(--space-3);
    }

    .time-container--flipped {
      top: auto;
      bottom: calc(100% + 4px);
    }

    .time-selectors {
      display: flex;
      gap: var(--space-2);
      align-items: stretch;
    }

    .time-column {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .time-column-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-secondary);
      text-align: center;
      margin-bottom: var(--space-2);
    }

    .time-scroll {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      scrollbar-width: thin;
      scrollbar-color: var(--color-border) transparent;
    }

    .time-scroll::-webkit-scrollbar {
      width: 6px;
    }

    .time-scroll::-webkit-scrollbar-track {
      background: transparent;
    }

    .time-scroll::-webkit-scrollbar-thumb {
      background: var(--color-border);
      border-radius: 3px;
    }

    .time-scroll::-webkit-scrollbar-thumb:hover {
      background: var(--color-border-hover);
    }

    .time-option {
      padding: var(--space-2) var(--space-3);
      cursor: pointer;
      transition: background-color var(--transition-fast);
      color: var(--color-text-primary);
      text-align: center;
      font-size: var(--font-size-sm);
    }

    .time-option:hover {
      background-color: var(--color-bg-secondary);
    }

    .time-option--selected {
      background-color: var(--color-primary);
      color: white;
      font-weight: var(--font-weight-medium);
    }

    .time-option--selected:hover {
      background-color: var(--color-primary);
    }

    .time-footer {
      margin-top: var(--space-3);
      padding-top: var(--space-3);
      border-top: 1px solid var(--color-border);
      display: flex;
      justify-content: center;
    }

    .time-now-btn {
      background: transparent;
      border: none;
      color: var(--color-primary);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .time-now-btn:hover {
      background-color: var(--color-bg-secondary);
      color: var(--color-primary);
    }

    .time-picker-error {
      font-size: var(--font-size-sm);
      color: var(--color-error);
      line-height: var(--line-height-tight);
    }

    .time-picker-hint {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      line-height: var(--line-height-tight);
    }
  `

  connectedCallback() {
    super.connectedCallback()
    this.parseValue()
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('value')) {
      this.parseValue()
    }
  }

  private parseValue() {
    if (!this.value) return

    // Parse HH:mm format
    const [hours, minutes] = this.value.split(':').map(Number)
    if (isNaN(hours) || isNaN(minutes)) return

    this.selectedMinute = minutes

    if (this.format === '12') {
      if (hours === 0) {
        this.selectedHour = 12
        this.selectedPeriod = 'AM'
      } else if (hours < 12) {
        this.selectedHour = hours
        this.selectedPeriod = 'AM'
      } else if (hours === 12) {
        this.selectedHour = 12
        this.selectedPeriod = 'PM'
      } else {
        this.selectedHour = hours - 12
        this.selectedPeriod = 'PM'
      }
    } else {
      this.selectedHour = hours
    }
  }

  private get displayValue(): string {
    if (!this.value) return ''

    const [hours, minutes] = this.value.split(':').map(Number)
    if (isNaN(hours) || isNaN(minutes)) return this.value

    if (this.format === '12') {
      const period = hours < 12 ? 'AM' : 'PM'
      const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
      return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`
    } else {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    }
  }

  private get hours(): number[] {
    if (this.format === '12') {
      return Array.from({ length: 12 }, (_, i) => i + 1)
    } else {
      return Array.from({ length: 24 }, (_, i) => i)
    }
  }

  private get minutes(): number[] {
    return Array.from({ length: 60 }, (_, i) => i)
  }

  private handleDisplayClick() {
    if (this.disabled) return
    this.toggleTimePicker()
  }

  private toggleTimePicker() {
    this.isOpen = !this.isOpen

    if (this.isOpen) {
      requestAnimationFrame(() => this.updateDropdownPosition())
    }
  }

  private updateDropdownPosition() {
    if (!this.timeContainer || !this.timeDisplay) return

    const displayRect = this.timeDisplay.getBoundingClientRect()
    const dropdownHeight = 300 // approximate height
    const spaceBelow = window.innerHeight - displayRect.bottom
    const spaceAbove = displayRect.top

    this.isFlipped = spaceBelow < dropdownHeight && spaceAbove > spaceBelow
  }

  private closeTimePicker() {
    this.isOpen = false
    this.isFlipped = false
    this.emitChange()
  }

  private selectHour(hour: number) {
    this.selectedHour = hour
  }

  private selectMinute(minute: number) {
    this.selectedMinute = minute
  }

  private selectPeriod(period: 'AM' | 'PM') {
    this.selectedPeriod = period
  }

  private selectNow() {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()

    this.selectedMinute = minutes

    if (this.format === '12') {
      if (hours === 0) {
        this.selectedHour = 12
        this.selectedPeriod = 'AM'
      } else if (hours < 12) {
        this.selectedHour = hours
        this.selectedPeriod = 'AM'
      } else if (hours === 12) {
        this.selectedHour = 12
        this.selectedPeriod = 'PM'
      } else {
        this.selectedHour = hours - 12
        this.selectedPeriod = 'PM'
      }
    } else {
      this.selectedHour = hours
    }

    this.closeTimePicker()
  }

  private emitChange() {
    let hours = this.selectedHour

    if (this.format === '12') {
      if (this.selectedPeriod === 'AM') {
        hours = this.selectedHour === 12 ? 0 : this.selectedHour
      } else {
        hours = this.selectedHour === 12 ? 12 : this.selectedHour + 12
      }
    }

    const timeString = `${String(hours).padStart(2, '0')}:${String(this.selectedMinute).padStart(2, '0')}`

    const oldValue = this.value
    this.value = timeString

    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: timeString, oldValue },
        bubbles: true,
        composed: true,
      })
    )
  }

  private handleKeydown(event: KeyboardEvent) {
    if (this.disabled) return

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (this.isOpen) {
          this.closeTimePicker()
        } else {
          this.toggleTimePicker()
        }
        break

      case 'Escape':
        event.preventDefault()
        if (this.isOpen) {
          this.isOpen = false
        }
        break
    }
  }

  render() {
    const hasError = !!this.error
    const wrapperClasses = {
      'time-wrapper': true,
      [`time-picker--${this.size}`]: true,
      'time-picker--error': hasError,
    }

    const displayClasses = {
      'time-display': true,
      'time-display--open': this.isOpen,
      'time-display--empty': !this.value,
      'time-disabled': this.disabled,
    }

    return html`
      <div class="time-picker-group">
        ${this.label
          ? html`
              <label for=${this.inputId} class="time-picker-label">
                ${this.label}
                ${this.required
                  ? html`<span class="required-indicator" aria-label="required">*</span>`
                  : ''}
              </label>
            `
          : ''}

        <div class=${classMap(wrapperClasses)}>
          <div
            id=${this.inputId}
            class=${classMap(displayClasses)}
            @click=${this.handleDisplayClick}
            @keydown=${this.handleKeydown}
            tabindex=${this.disabled ? -1 : 0}
            role="button"
            aria-haspopup="dialog"
            aria-expanded=${this.isOpen}
            aria-describedby=${ifDefined(hasError ? `${this.inputId}-error` : undefined)}
            aria-invalid=${hasError}
          >
            ${this.displayValue || this.placeholder}
          </div>

          <div class="time-icon">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clip-rule="evenodd"
              />
            </svg>
          </div>

          ${this.isOpen
            ? html`
                <div class="time-overlay" @click=${this.closeTimePicker}></div>
                <div
                  class=${classMap({
                    'time-container': true,
                    'time-container--flipped': this.isFlipped,
                  })}
                  role="dialog"
                  aria-label="Choose time"
                >
                  <div class="time-selectors">
                    <div class="time-column">
                      <div class="time-column-label">Hour</div>
                      <div class="time-scroll">
                        ${this.hours.map(
                          hour => html`
                            <div
                              class=${classMap({
                                'time-option': true,
                                'time-option--selected': hour === this.selectedHour,
                              })}
                              @click=${() => this.selectHour(hour)}
                            >
                              ${this.format === '24' ? String(hour).padStart(2, '0') : hour}
                            </div>
                          `
                        )}
                      </div>
                    </div>

                    <div class="time-column">
                      <div class="time-column-label">Minute</div>
                      <div class="time-scroll">
                        ${this.minutes.map(
                          minute => html`
                            <div
                              class=${classMap({
                                'time-option': true,
                                'time-option--selected': minute === this.selectedMinute,
                              })}
                              @click=${() => this.selectMinute(minute)}
                            >
                              ${String(minute).padStart(2, '0')}
                            </div>
                          `
                        )}
                      </div>
                    </div>

                    ${this.format === '12'
                      ? html`
                          <div class="time-column">
                            <div class="time-column-label">Period</div>
                            <div class="time-scroll">
                              ${['AM', 'PM'].map(
                                period => html`
                                  <div
                                    class=${classMap({
                                      'time-option': true,
                                      'time-option--selected': period === this.selectedPeriod,
                                    })}
                                    @click=${() => this.selectPeriod(period as 'AM' | 'PM')}
                                  >
                                    ${period}
                                  </div>
                                `
                              )}
                            </div>
                          </div>
                        `
                      : ''}
                  </div>

                  <div class="time-footer">
                    <button type="button" class="time-now-btn" @click=${this.selectNow}>
                      Now
                    </button>
                  </div>
                </div>
              `
            : ''}
        </div>

        ${hasError
          ? html`
              <div id="${this.inputId}-error" class="time-picker-error" role="alert">
                ${this.error}
              </div>
            `
          : this.hint
            ? html` <div class="time-picker-hint">${this.hint}</div> `
            : ''}
      </div>
    `
  }
}
