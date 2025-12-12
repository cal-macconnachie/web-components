import { css, html } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { BaseElement } from '../base-element'
import './base-date-picker'
import './base-time-picker'
import type { BaseDatePicker } from './base-date-picker'
import type { BaseTimePicker } from './base-time-picker'

type DateTimePickerSize = 'sm' | 'md' | 'lg'
type TimeFormat = '12' | '24'

@customElement('base-datetime-picker')
export class BaseDateTimePicker extends BaseElement {
  @property({ type: String }) value = ''
  @property({ type: String }) label?: string
  @property({ type: String }) placeholder = 'Select date and time'
  @property({ type: Boolean, reflect: true }) required = false
  @property({ type: Boolean, reflect: true }) disabled = false
  @property({ type: String }) error?: string
  @property({ type: String }) hint?: string
  @property({ type: String }) size: DateTimePickerSize = 'md'
  @property({ type: String }) minDate?: string
  @property({ type: String }) maxDate?: string
  @property({ type: String }) format: TimeFormat = '12'

  @state() private dateValue = ''
  @state() private timeValue = ''
  @state() private isFocused = false

  @query('base-date-picker') private datePicker?: BaseDatePicker
  @query('base-time-picker') private timePicker?: BaseTimePicker

  private inputId = `datetime-picker-${Math.random().toString(36).substring(2, 9)}`

  static styles = css`
    :host {
      display: block;
      position: relative;
    }

    .datetime-picker-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .datetime-picker-label {
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

    .datetime-pickers {
      display: flex;
      position: relative;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-bg-primary);
      transition: all var(--transition-fast);
    }

    .datetime-pickers:hover:not(.datetime-pickers--disabled) {
      border-color: var(--color-border-hover);
    }

    .datetime-pickers--focused {
      border-color: var(--color-border-focus);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .datetime-pickers--error {
      border-color: var(--color-error);
    }

    .datetime-pickers--error.datetime-pickers--focused {
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }

    .picker-wrapper {
      flex: 1;
      position: relative;
    }

    .picker-wrapper--date {
      margin-right: -1px;
    }

    .picker-wrapper--time {
      margin-left: -1px;
    }

    .picker-wrapper + .picker-wrapper::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      height: 60%;
      width: 1px;
      background: var(--color-border);
      z-index: 1;
      pointer-events: none;
    }

    /* Hide child picker borders and shadows using CSS custom properties */
    base-date-picker,
    base-time-picker {
      display: block;
      --picker-display-border: none;
      --picker-display-box-shadow: none;
      --picker-display-border-color-hover: transparent;
      --picker-display-border-color-focus: transparent;
    }

    /* Add border radius to outer edges for seamless rounded corners */
    .picker-wrapper--date base-date-picker {
      --picker-display-border-radius: var(--radius-md) 0 0 var(--radius-md);
    }

    .picker-wrapper--time base-time-picker {
      --picker-display-border-radius: 0 var(--radius-md) var(--radius-md) 0;
    }

    .datetime-picker-error {
      font-size: var(--font-size-sm);
      color: var(--color-error);
      line-height: var(--line-height-tight);
    }

    .datetime-picker-hint {
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
    if (!this.value) {
      this.dateValue = ''
      this.timeValue = ''
      return
    }

    // Parse ISO 8601 format: YYYY-MM-DDTHH:mm
    const [datePart, timePart] = this.value.split('T')
    this.dateValue = datePart || ''
    this.timeValue = timePart || ''
  }

  private handleDateChange(event: CustomEvent) {
    event.stopPropagation()
    const newDate = event.detail.value

    // If we have a time, combine them; otherwise just set the date with a default time
    const time = this.timeValue || '00:00'
    const newValue = `${newDate}T${time}`

    const oldValue = this.value
    this.value = newValue

    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: newValue, oldValue },
        bubbles: true,
        composed: true,
      })
    )

    // If time is not set, automatically open the time picker
    if (!this.timeValue && this.timePicker && !this.disabled) {
      requestAnimationFrame(() => {
        const timeDisplay = this.timePicker?.shadowRoot?.querySelector('.time-display') as HTMLElement
        if (timeDisplay) {
          timeDisplay.click()
        }
      })
    }
  }

  private handleTimeChange(event: CustomEvent) {
    event.stopPropagation()
    const newTime = event.detail.value

    // If we have a date, combine them; otherwise set current date
    let date = this.dateValue
    if (!date) {
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      date = `${year}-${month}-${day}`
    }

    const newValue = `${date}T${newTime}`

    const oldValue = this.value
    this.value = newValue

    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: newValue, oldValue },
        bubbles: true,
        composed: true,
      })
    )

    // If date is not set, automatically open the date picker
    if (!this.dateValue && this.datePicker && !this.disabled) {
      requestAnimationFrame(() => {
        const dateDisplay = this.datePicker?.shadowRoot?.querySelector('.date-display') as HTMLElement
        if (dateDisplay) {
          dateDisplay.click()
        }
      })
    }
  }

  private handleFocusIn() {
    this.isFocused = true
  }

  private handleFocusOut() {
    this.isFocused = false
  }

  render() {
    const hasError = !!this.error
    const pickersClasses = {
      'datetime-pickers': true,
      'datetime-pickers--focused': this.isFocused,
      'datetime-pickers--error': hasError,
      'datetime-pickers--disabled': this.disabled,
    }

    return html`
      <div class="datetime-picker-group">
        ${this.label
          ? html`
              <label for=${this.inputId} class="datetime-picker-label">
                ${this.label}
                ${this.required
                  ? html`<span class="required-indicator" aria-label="required">*</span>`
                  : ''}
              </label>
            `
          : ''}

        <div
          class=${classMap(pickersClasses)}
          id=${this.inputId}
          @focusin=${this.handleFocusIn}
          @focusout=${this.handleFocusOut}
        >
          <div class="picker-wrapper picker-wrapper--date">
            <base-date-picker
              .value=${this.dateValue}
              placeholder="Select date"
              .size=${this.size}
              .disabled=${this.disabled}
              .required=${this.required}
              .minDate=${this.minDate}
              .maxDate=${this.maxDate}
              @change=${this.handleDateChange}
              aria-describedby=${ifDefined(hasError ? `${this.inputId}-error` : undefined)}
              aria-invalid=${hasError}
            ></base-date-picker>
          </div>

          <div class="picker-wrapper picker-wrapper--time">
            <base-time-picker
              .value=${this.timeValue}
              placeholder="Select time"
              .size=${this.size}
              .disabled=${this.disabled}
              .required=${this.required}
              .format=${this.format}
              @change=${this.handleTimeChange}
              aria-describedby=${ifDefined(hasError ? `${this.inputId}-error` : undefined)}
              aria-invalid=${hasError}
            ></base-time-picker>
          </div>
        </div>

        ${hasError
          ? html`
              <div id="${this.inputId}-error" class="datetime-picker-error" role="alert">
                ${this.error}
              </div>
            `
          : this.hint
            ? html` <div class="datetime-picker-hint">${this.hint}</div> `
            : ''}
      </div>
    `
  }
}
