import { css, html } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { BaseElement } from '../base-element'

type DatePickerSize = 'sm' | 'md' | 'lg'

@customElement('base-date-picker')
export class BaseDatePicker extends BaseElement {
  @property({ type: String }) value = ''
  @property({ type: String }) label?: string
  @property({ type: String }) placeholder = 'Select a date'
  @property({ type: Boolean, reflect: true }) required = false
  @property({ type: Boolean, reflect: true }) disabled = false
  @property({ type: String }) error?: string
  @property({ type: String }) hint?: string
  @property({ type: String }) size: DatePickerSize = 'md'
  @property({ type: String }) minDate?: string
  @property({ type: String }) maxDate?: string

  @state() private isOpen = false
  @state() private currentMonth = new Date().getMonth()
  @state() private currentYear = new Date().getFullYear()
  @state() private showMonthPicker = false
  @state() private showYearPicker = false
  @state() private yearRangeStart = new Date().getFullYear() - 5
  @state() private isFlipped = false

  @query('.date-display') private dateDisplay!: HTMLDivElement
  @query('.calendar-container') private calendarContainer?: HTMLDivElement

  private inputId = `date-picker-${Math.random().toString(36).substr(2, 9)}`
  private weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  private monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]

  static styles = css`
    :host {
      display: block;
      position: relative;
    }

    .date-picker-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .date-picker-label {
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

    .date-wrapper {
      position: relative;
    }

    .date-display {
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

    .date-display:hover:not(.date-disabled) {
      border-color: var(--picker-display-border-color-hover, var(--color-border-hover));
    }

    .date-display--open {
      border-color: var(--picker-display-border-color-focus, var(--color-border-focus));
      box-shadow: var(--picker-display-box-shadow, 0 0 0 3px rgba(59, 130, 246, 0.1));
    }

    .date-display--empty {
      color: var(--color-text-muted);
    }

    /* Sizes */
    .date-picker--sm .date-display {
      padding: var(--space-2) var(--space-3);
      padding-right: var(--space-8);
      font-size: var(--font-size-sm);
    }

    .date-picker--md .date-display {
      padding: var(--space-3) var(--space-4);
      padding-right: var(--space-10);
      font-size: var(--font-size-base);
    }

    .date-picker--lg .date-display {
      padding: var(--space-4) var(--space-5);
      padding-right: var(--space-12);
      font-size: var(--font-size-lg);
    }

    /* States */
    .date-picker--error .date-display {
      border-color: var(--color-error);
    }

    .date-picker--error .date-display--open {
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }

    .date-disabled {
      opacity: 0.5;
      cursor: not-allowed !important;
      background-color: var(--color-bg-muted);
    }

    .date-icon {
      position: absolute;
      right: var(--space-3);
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-text-secondary);
      pointer-events: none;
    }

    .date-icon svg {
      width: 1.25em;
      height: 1.25em;
      display: block;
    }

    /* Calendar Dropdown */
    .calendar-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 999;
      background: transparent;
    }

    .calendar-container {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      min-width: 280px;
      min-height: 320px;
      background: var(--color-bg-primary);
      border: 1px solid var(--color-border-focus);
      border-radius: var(--radius-md);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      z-index: 1000;
      padding: var(--space-3);
    }

    .calendar-container--flipped {
      top: auto;
      bottom: calc(100% + 4px);
    }

    .calendar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-3);
      padding: 0 var(--space-2);
    }

    .calendar-nav {
      background: none;
      border: none;
      color: var(--color-text-secondary);
      font-size: 1.25rem;
      cursor: pointer;
      padding: var(--space-1) var(--space-2);
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .calendar-nav:hover {
      background-color: var(--color-bg-secondary);
      color: var(--color-text-primary);
    }

    .calendar-month-year {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
      display: flex;
      gap: var(--space-2);
      align-items: center;
    }

    .month-selector,
    .year-selector {
      cursor: pointer;
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-md);
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }

    .month-selector:hover,
    .year-selector:hover {
      background-color: var(--color-bg-secondary);
      border-color: var(--color-border);
    }

    .calendar-weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 0;
      margin-bottom: var(--space-2);
    }

    .calendar-weekday {
      text-align: center;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-secondary);
      padding: var(--space-1);
    }

    .calendar-days {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
      padding: var(--space-2) 0;
    }

    .calendar-day {
      aspect-ratio: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-size-sm);
      color: var(--color-text-primary);
      cursor: pointer;
      border-radius: 50%;
      transition: all 0.15s ease;
    }

    .calendar-day:not(.day-empty):not(.day-disabled):hover {
      background-color: var(--color-bg-secondary);
    }

    .day-empty {
      cursor: default;
    }

    .day-selected {
      background-color: var(--color-primary);
      color: white;
      font-weight: var(--font-weight-medium);
    }

    .day-selected:hover {
      background-color: var(--color-primary) !important;
      transform: scale(1.1);
    }

    .day-today {
      position: relative;
      font-weight: var(--font-weight-medium);
    }

    .day-today::after {
      content: '';
      position: absolute;
      bottom: 2px;
      left: 50%;
      transform: translateX(-50%);
      width: 4px;
      height: 4px;
      background-color: var(--color-primary);
      border-radius: 50%;
    }

    .day-selected.day-today::after {
      background-color: white;
    }

    .day-disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .day-disabled:hover {
      background-color: transparent !important;
    }

    .calendar-footer {
      margin-top: var(--space-2);
      padding-top: var(--space-2);
      border-top: 1px solid var(--color-border);
      display: flex;
      justify-content: center;
    }

    .calendar-today-btn {
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

    .calendar-today-btn:hover {
      background-color: var(--color-bg-secondary);
      color: var(--color-primary);
    }

    /* Picker Overlay */
    .picker-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--color-bg-primary);
      border-radius: var(--radius-md);
      padding: var(--space-3);
      z-index: 10;
      animation: fadeIn 0.15s ease;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    /* Month Picker */
    .month-picker-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .month-picker-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-2);
      flex: 1;
      align-content: center;
    }

    .month-item {
      padding: var(--space-4) var(--space-2);
      text-align: center;
      cursor: pointer;
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      color: var(--color-text-primary);
      transition: all 0.15s ease;
      border: 1px solid transparent;
    }

    .month-item:hover {
      background-color: var(--color-bg-secondary);
    }

    .month-selected {
      background-color: var(--color-primary);
      color: white;
      font-weight: var(--font-weight-medium);
    }

    .month-selected:hover {
      background-color: var(--color-primary);
    }

    /* Year Picker */
    .year-picker-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .year-picker-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-3);
      padding: var(--space-2);
      border-bottom: 1px solid var(--color-border);
      flex-shrink: 0;
    }

    .year-nav {
      background: none;
      border: none;
      color: var(--color-text-secondary);
      font-size: 1.25rem;
      cursor: pointer;
      padding: var(--space-1) var(--space-2);
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .year-nav:hover {
      background-color: var(--color-bg-secondary);
      color: var(--color-text-primary);
    }

    .year-range {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
    }

    .year-picker-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-2);
      flex: 1;
      align-content: center;
    }

    .year-item {
      padding: var(--space-4) var(--space-2);
      text-align: center;
      cursor: pointer;
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      color: var(--color-text-primary);
      transition: all 0.15s ease;
      border: 1px solid transparent;
    }

    .year-item:hover {
      background-color: var(--color-bg-secondary);
    }

    .year-selected {
      background-color: var(--color-primary);
      color: white;
      font-weight: var(--font-weight-medium);
    }

    .year-selected:hover {
      background-color: var(--color-primary);
    }

    .date-picker-error {
      font-size: var(--font-size-sm);
      color: var(--color-error);
      line-height: var(--line-height-tight);
    }

    .date-picker-hint {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      line-height: var(--line-height-tight);
    }
  `

  private get displayValue(): string {
    if (!this.value) return ''

    const date = new Date(this.value + 'T00:00:00')
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    }

    return this.value
  }

  private get currentMonthName(): string {
    const date = new Date(this.currentYear, this.currentMonth)
    return date.toLocaleDateString('en-US', { month: 'long' })
  }

  private get yearRangeEnd(): number {
    return this.yearRangeStart + 11
  }

  private get yearRange(): number[] {
    const years: number[] = []
    for (let i = this.yearRangeStart; i <= this.yearRangeEnd; i++) {
      years.push(i)
    }
    return years
  }

  private get calendarDays(): (number | null)[] {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1)
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0)
    const startPadding = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const days: (number | null)[] = []

    for (let i = 0; i < startPadding; i++) {
      days.push(null)
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    while (days.length < 42) {
      days.push(null)
    }

    return days.slice(0, 42)
  }

  private handleDisplayClick() {
    if (this.disabled) return
    this.toggleCalendar()
  }

  private toggleCalendar() {
    this.isOpen = !this.isOpen

    if (this.isOpen && this.value) {
      const date = new Date(this.value + 'T00:00:00')
      if (!isNaN(date.getTime())) {
        this.currentMonth = date.getMonth()
        this.currentYear = date.getFullYear()
      }
    }

    if (this.isOpen) {
      requestAnimationFrame(() => this.updateDropdownPosition())
    }
  }

  private updateDropdownPosition() {
    if (!this.calendarContainer || !this.dateDisplay) return

    const displayRect = this.dateDisplay.getBoundingClientRect()
    const dropdownHeight = 400 // approximate height
    const spaceBelow = window.innerHeight - displayRect.bottom
    const spaceAbove = displayRect.top

    this.isFlipped = spaceBelow < dropdownHeight && spaceAbove > spaceBelow
  }

  private closeCalendar() {
    this.isOpen = false
    this.showMonthPicker = false
    this.showYearPicker = false
    this.isFlipped = false
  }

  private selectDate(day: number) {
    const selectedDate = new Date(this.currentYear, this.currentMonth, day)

    const year = selectedDate.getFullYear()
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
    const dayStr = String(selectedDate.getDate()).padStart(2, '0')
    const isoDate = `${year}-${month}-${dayStr}`

    const oldValue = this.value
    this.value = isoDate

    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: isoDate, oldValue },
        bubbles: true,
        composed: true,
      })
    )

    this.closeCalendar()
  }

  private selectToday() {
    const today = new Date()

    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const isoDate = `${year}-${month}-${day}`

    const oldValue = this.value
    this.value = isoDate

    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: isoDate, oldValue },
        bubbles: true,
        composed: true,
      })
    )

    this.closeCalendar()
  }

  private previousMonth(event: Event) {
    event.stopPropagation()
    if (this.currentMonth === 0) {
      this.currentMonth = 11
      this.currentYear--
    } else {
      this.currentMonth--
    }
  }

  private nextMonth(event: Event) {
    event.stopPropagation()
    if (this.currentMonth === 11) {
      this.currentMonth = 0
      this.currentYear++
    } else {
      this.currentMonth++
    }
  }

  private isSelectedDate(day: number): boolean {
    if (!this.value) return false

    const date = new Date(this.value + 'T00:00:00')
    return (
      date.getDate() === day &&
      date.getMonth() === this.currentMonth &&
      date.getFullYear() === this.currentYear
    )
  }

  private isToday(day: number): boolean {
    const today = new Date()
    return (
      today.getDate() === day &&
      today.getMonth() === this.currentMonth &&
      today.getFullYear() === this.currentYear
    )
  }

  private isDisabled(day: number): boolean {
    const date = new Date(this.currentYear, this.currentMonth, day)

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const dayStr = String(date.getDate()).padStart(2, '0')
    const isoDate = `${year}-${month}-${dayStr}`

    if (this.minDate && isoDate < this.minDate) return true
    if (this.maxDate && isoDate > this.maxDate) return true

    return false
  }

  private selectMonth(monthIndex: number) {
    this.currentMonth = monthIndex
    this.showMonthPicker = false
  }

  private selectYear(year: number) {
    this.currentYear = year
    this.showYearPicker = false

    if (year < this.yearRangeStart || year > this.yearRangeEnd) {
      this.yearRangeStart = year - 5
    }
  }

  private yearRangeBack(event: Event) {
    event.stopPropagation()
    this.yearRangeStart -= 12
  }

  private yearRangeForward(event: Event) {
    event.stopPropagation()
    this.yearRangeStart += 12
  }

  private handleKeydown(event: KeyboardEvent) {
    if (this.disabled) return

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault()
        this.toggleCalendar()
        break

      case 'Escape':
        event.preventDefault()
        this.closeCalendar()
        break
    }
  }

  render() {
    const hasError = !!this.error
    const wrapperClasses = {
      'date-wrapper': true,
      [`date-picker--${this.size}`]: true,
      'date-picker--error': hasError,
    }

    const displayClasses = {
      'date-display': true,
      'date-display--open': this.isOpen,
      'date-display--empty': !this.value,
      'date-disabled': this.disabled,
    }

    return html`
      <div class="date-picker-group">
        ${this.label
          ? html`
              <label for=${this.inputId} class="date-picker-label">
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

          <div class="date-icon">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clip-rule="evenodd"
              />
            </svg>
          </div>

          ${this.isOpen
            ? html`
                <div class="calendar-overlay" @click=${this.closeCalendar}></div>
                <div
                  class=${classMap({
                    'calendar-container': true,
                    'calendar-container--flipped': this.isFlipped,
                  })}
                  role="dialog"
                  aria-label="Choose date"
                >
                  ${this.showMonthPicker
                    ? html`
                        <div class="picker-overlay">
                          <div class="month-picker-container">
                            <div class="month-picker-grid">
                              ${this.monthNames.map(
                                (month, index) => html`
                                  <div
                                    class=${classMap({
                                      'month-item': true,
                                      'month-selected': index === this.currentMonth,
                                    })}
                                    @click=${() => this.selectMonth(index)}
                                  >
                                    ${month}
                                  </div>
                                `
                              )}
                            </div>
                          </div>
                        </div>
                      `
                    : this.showYearPicker
                      ? html`
                          <div class="picker-overlay">
                            <div class="year-picker-container">
                              <div class="year-picker-header">
                                <button
                                  type="button"
                                  class="year-nav"
                                  @click=${this.yearRangeBack}
                                >
                                  ‹
                                </button>
                                <span class="year-range"
                                  >${this.yearRangeStart} - ${this.yearRangeEnd}</span
                                >
                                <button
                                  type="button"
                                  class="year-nav"
                                  @click=${this.yearRangeForward}
                                >
                                  ›
                                </button>
                              </div>
                              <div class="year-picker-grid">
                                ${this.yearRange.map(
                                  year => html`
                                    <div
                                      class=${classMap({
                                        'year-item': true,
                                        'year-selected': year === this.currentYear,
                                      })}
                                      @click=${() => this.selectYear(year)}
                                    >
                                      ${year}
                                    </div>
                                  `
                                )}
                              </div>
                            </div>
                          </div>
                        `
                      : html`
                          <div class="calendar-header">
                            <button
                              type="button"
                              class="calendar-nav"
                              @click=${this.previousMonth}
                            >
                              ‹
                            </button>
                            <div class="calendar-month-year">
                              <span
                                class="month-selector"
                                @click=${() => (this.showMonthPicker = true)}
                              >
                                ${this.currentMonthName}
                              </span>
                              <span
                                class="year-selector"
                                @click=${() => (this.showYearPicker = true)}
                              >
                                ${this.currentYear}
                              </span>
                            </div>
                            <button type="button" class="calendar-nav" @click=${this.nextMonth}>
                              ›
                            </button>
                          </div>

                          <div class="calendar-weekdays">
                            ${this.weekDays.map(day => html`<div class="calendar-weekday">${day}</div>`)}
                          </div>

                          <div class="calendar-days">
                            ${this.calendarDays.map(
                              day =>
                                day
                                  ? html`
                                      <div
                                        class=${classMap({
                                          'calendar-day': true,
                                          'day-selected': this.isSelectedDate(day),
                                          'day-today': this.isToday(day),
                                          'day-disabled': this.isDisabled(day),
                                        })}
                                        @click=${() => !this.isDisabled(day) && this.selectDate(day)}
                                      >
                                        ${day}
                                      </div>
                                    `
                                  : html`<div class="calendar-day day-empty"></div>`
                            )}
                          </div>

                          <div class="calendar-footer">
                            <button
                              type="button"
                              class="calendar-today-btn"
                              @click=${this.selectToday}
                            >
                              Today
                            </button>
                          </div>
                        `}
                </div>
              `
            : ''}
        </div>

        ${hasError
          ? html`
              <div id="${this.inputId}-error" class="date-picker-error" role="alert">
                ${this.error}
              </div>
            `
          : this.hint
            ? html` <div class="date-picker-hint">${this.hint}</div> `
            : ''}
      </div>
    `
  }
}
