import { css, html } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { BaseElement } from '../base-element'

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

  @state() private isOpen = false
  @state() private currentMonth = new Date().getMonth()
  @state() private currentYear = new Date().getFullYear()
  @state() private showMonthPicker = false
  @state() private showYearPicker = false
  @state() private yearRangeStart = new Date().getFullYear() - 5
  @state() private selectedDate = ''
  @state() private selectedHour = 12
  @state() private selectedMinute = 0
  @state() private selectedPeriod: 'AM' | 'PM' = 'AM'
  @state() private isFlipped = false
  @state() private currentStep: 'date' | 'time' = 'date'

  @query('.datetime-display') private datetimeDisplay!: HTMLDivElement
  @query('.datetime-container') private datetimeContainer?: HTMLDivElement

  private inputId = `datetime-picker-${Math.random().toString(36).substr(2, 9)}`
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

    .datetime-wrapper {
      position: relative;
    }

    .datetime-display {
      width: 100%;
      font-family: var(--font-family-sans);
      background-color: var(--color-bg-primary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      transition: all var(--transition-fast);
      color: var(--color-text-primary);
      cursor: pointer;
      user-select: none;
      display: flex;
      align-items: center;
      box-sizing: border-box;
    }

    .datetime-display:hover:not(.datetime-disabled) {
      border-color: var(--color-border-hover);
    }

    .datetime-display--open {
      border-color: var(--color-border-focus);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .datetime-display--empty {
      color: var(--color-text-muted);
    }

    /* Sizes */
    .datetime-picker--sm .datetime-display {
      padding: var(--space-2) var(--space-3);
      padding-right: var(--space-8);
      font-size: var(--font-size-sm);
    }

    .datetime-picker--md .datetime-display {
      padding: var(--space-3) var(--space-4);
      padding-right: var(--space-10);
      font-size: var(--font-size-base);
    }

    .datetime-picker--lg .datetime-display {
      padding: var(--space-4) var(--space-5);
      padding-right: var(--space-12);
      font-size: var(--font-size-lg);
    }

    /* States */
    .datetime-picker--error .datetime-display {
      border-color: var(--color-error);
    }

    .datetime-picker--error .datetime-display--open {
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }

    .datetime-disabled {
      opacity: 0.5;
      cursor: not-allowed !important;
      background-color: var(--color-bg-muted);
    }

    .datetime-icon {
      position: absolute;
      right: var(--space-3);
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-text-secondary);
      pointer-events: none;
    }

    .datetime-icon svg {
      width: 1.25em;
      height: 1.25em;
      display: block;
    }

    /* DateTime Picker Container */
    .datetime-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 999;
      background: transparent;
    }

    .datetime-container {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      min-width: 300px;
      background: var(--color-bg-primary);
      border: 1px solid var(--color-border-focus);
      border-radius: var(--radius-md);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      z-index: 1000;
      padding: var(--space-2);
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .datetime-container--flipped {
      top: auto;
      bottom: calc(100% + 4px);
    }

    /* Calendar Styles (same as date-picker) */
    .calendar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-2);
      padding: 0 var(--space-1);
    }

    .calendar-nav {
      background: none;
      border: none;
      color: var(--color-text-secondary);
      font-size: 1.1rem;
      cursor: pointer;
      padding: var(--space-1);
      border-radius: 50%;
      width: 28px;
      height: 28px;
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
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
      display: flex;
      gap: var(--space-1);
      align-items: center;
    }

    .month-selector,
    .year-selector {
      cursor: pointer;
      padding: 2px var(--space-2);
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
      margin-bottom: var(--space-1);
    }

    .calendar-weekday {
      text-align: center;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-secondary);
      padding: 2px;
    }

    .calendar-days {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1px;
      padding: var(--space-1) 0;
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
      min-height: 32px;
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

    /* Time Selectors */
    .time-section {
      display: flex;
      flex-direction: column;
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

    /* Footer */
    .datetime-footer {
      display: flex;
      justify-content: space-between;
      gap: var(--space-2);
      border-top: 1px solid var(--color-border);
      padding-top: var(--space-3);
      margin-top: var(--space-3);
    }

    .datetime-btn {
      flex: 1;
      background: transparent;
      border: none;
      color: var(--color-primary);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .datetime-btn:hover {
      background-color: var(--color-bg-secondary);
      color: var(--color-primary);
    }

    /* Step indicator */
    .step-header {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding-bottom: var(--space-2);
      border-bottom: 1px solid var(--color-border);
      margin-bottom: var(--space-2);
    }

    .step-back-btn {
      background: none;
      border: none;
      color: var(--color-text-secondary);
      font-size: 1.1rem;
      cursor: pointer;
      padding: var(--space-1);
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .step-back-btn:hover {
      background-color: var(--color-bg-secondary);
      color: var(--color-text-primary);
    }

    .step-title {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
      flex: 1;
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

    .month-picker-container,
    .year-picker-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .month-picker-grid,
    .year-picker-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-2);
      flex: 1;
      align-content: center;
    }

    .month-item,
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

    .month-item:hover,
    .year-item:hover {
      background-color: var(--color-bg-secondary);
    }

    .month-selected,
    .year-selected {
      background-color: var(--color-primary);
      color: white;
      font-weight: var(--font-weight-medium);
    }

    .month-selected:hover,
    .year-selected:hover {
      background-color: var(--color-primary);
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
    if (!this.value) return

    // Parse ISO 8601 format: YYYY-MM-DDTHH:mm
    const [datePart, timePart] = this.value.split('T')
    if (!datePart || !timePart) return

    this.selectedDate = datePart

    const date = new Date(datePart + 'T00:00:00')
    if (!isNaN(date.getTime())) {
      this.currentMonth = date.getMonth()
      this.currentYear = date.getFullYear()
    }

    const [hours, minutes] = timePart.split(':').map(Number)
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

    const [datePart, timePart] = this.value.split('T')
    if (!datePart || !timePart) return this.value

    const date = new Date(datePart + 'T00:00:00')
    const dateStr = !isNaN(date.getTime())
      ? date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : datePart

    const [hours, minutes] = timePart.split(':').map(Number)
    let timeStr = timePart

    if (!isNaN(hours) && !isNaN(minutes)) {
      if (this.format === '12') {
        const period = hours < 12 ? 'AM' : 'PM'
        const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
        timeStr = `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`
      } else {
        timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
      }
    }

    return `${dateStr} ${timeStr}`
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
    this.togglePicker()
  }

  private togglePicker() {
    this.isOpen = !this.isOpen

    if (this.isOpen && !this.selectedDate) {
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      this.selectedDate = `${year}-${month}-${day}`
    }

    if (this.isOpen) {
      requestAnimationFrame(() => this.updateDropdownPosition())
    }
  }

  private updateDropdownPosition() {
    if (!this.datetimeContainer || !this.datetimeDisplay) return

    const displayRect = this.datetimeDisplay.getBoundingClientRect()
    const dropdownHeight = 320 // approximate height for compact date picker
    const spaceBelow = window.innerHeight - displayRect.bottom
    const spaceAbove = displayRect.top

    this.isFlipped = spaceBelow < dropdownHeight && spaceAbove > spaceBelow
  }

  private closePicker() {
    this.isOpen = false
    this.showMonthPicker = false
    this.showYearPicker = false
    this.isFlipped = false
    this.currentStep = 'date'
  }

  private selectDate(day: number) {
    const selectedDate = new Date(this.currentYear, this.currentMonth, day)

    const year = selectedDate.getFullYear()
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
    const dayStr = String(selectedDate.getDate()).padStart(2, '0')

    this.selectedDate = `${year}-${month}-${dayStr}`

    // Move to time selection step
    this.currentStep = 'time'
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

  private goBackToDateStep() {
    this.currentStep = 'date'
  }

  private selectNow() {
    const now = new Date()

    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    this.selectedDate = `${year}-${month}-${day}`

    this.currentMonth = now.getMonth()
    this.currentYear = now.getFullYear()

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

    this.applyDateTime()
  }

  private applyDateTime() {
    if (!this.selectedDate) return

    let hours = this.selectedHour

    if (this.format === '12') {
      if (this.selectedPeriod === 'AM') {
        hours = this.selectedHour === 12 ? 0 : this.selectedHour
      } else {
        hours = this.selectedHour === 12 ? 12 : this.selectedHour + 12
      }
    }

    const timeString = `${String(hours).padStart(2, '0')}:${String(this.selectedMinute).padStart(2, '0')}`
    const dateTimeString = `${this.selectedDate}T${timeString}`

    const oldValue = this.value
    this.value = dateTimeString

    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: dateTimeString, oldValue },
        bubbles: true,
        composed: true,
      })
    )

    this.closePicker()
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
    if (!this.selectedDate) return false

    const date = new Date(this.selectedDate + 'T00:00:00')
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
        if (this.isOpen) {
          this.applyDateTime()
        } else {
          this.togglePicker()
        }
        break

      case 'Escape':
        event.preventDefault()
        this.closePicker()
        break
    }
  }

  render() {
    const hasError = !!this.error
    const wrapperClasses = {
      'datetime-wrapper': true,
      [`datetime-picker--${this.size}`]: true,
      'datetime-picker--error': hasError,
    }

    const displayClasses = {
      'datetime-display': true,
      'datetime-display--open': this.isOpen,
      'datetime-display--empty': !this.value,
      'datetime-disabled': this.disabled,
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

          <div class="datetime-icon">
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
                <div class="datetime-overlay" @click=${this.closePicker}></div>
                <div
                  class=${classMap({
                    'datetime-container': true,
                    'datetime-container--flipped': this.isFlipped,
                  })}
                  role="dialog"
                  aria-label="Choose date and time"
                >
                  ${this.currentStep === 'date'
                    ? html`
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
                                <div class="step-header">
                                  <div class="step-title">Select Date</div>
                                </div>
                                <div class="calendar-section">
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
                                    <button
                                      type="button"
                                      class="calendar-nav"
                                      @click=${this.nextMonth}
                                    >
                                      ›
                                    </button>
                                  </div>

                                  <div class="calendar-weekdays">
                                    ${this.weekDays.map(
                                      day => html`<div class="calendar-weekday">${day}</div>`
                                    )}
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
                                                @click=${() =>
                                                  !this.isDisabled(day) && this.selectDate(day)}
                                              >
                                                ${day}
                                              </div>
                                            `
                                          : html`<div class="calendar-day day-empty"></div>`
                                    )}
                                  </div>
                                </div>

                                <div class="datetime-footer">
                                  <button type="button" class="datetime-btn" @click=${this.selectNow}>
                                    Now
                                  </button>
                                </div>
                              `}
                      `
                    : html`
                        <div class="step-header">
                          <button
                            type="button"
                            class="step-back-btn"
                            @click=${this.goBackToDateStep}
                            aria-label="Go back to date selection"
                          >
                            ‹
                          </button>
                          <div class="step-title">Select Time</div>
                        </div>

                        <div class="time-section">
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
                        </div>

                        <div class="datetime-footer">
                          <button type="button" class="datetime-btn" @click=${this.applyDateTime}>
                            Apply
                          </button>
                        </div>
                      `}
                </div>
              `
            : ''}
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
