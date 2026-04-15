import { css, html } from 'lit'
import { property, query, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { BaseElement } from '../base-element'
import { register } from '../helpers/register'
import './base-date-picker'
import { BaseDatePicker } from './base-date-picker'
import './base-time-picker'
import { BaseTimePicker } from './base-time-picker'

type DateTimePickerSize = 'sm' | 'md' | 'lg'
type TimeFormat = '12' | '24'
type Step = 'date' | 'time'

export const registerBaseDateTimePicker = () => {
  register({ name: 'base-date-picker', element: BaseDatePicker })
  register({ name: 'base-time-picker', element: BaseTimePicker })
  register({ name: 'base-datetime-picker', element: BaseDateTimePicker })
}

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
  @state() private step: Step = 'date'
  @state() private draftDate = ''
  @state() private draftHour = 12
  @state() private draftMinute = 0
  @state() private draftPeriod: 'AM' | 'PM' = 'AM'
  @state() private currentMonth = new Date().getMonth()
  @state() private currentYear = new Date().getFullYear()
  @state() private showMonthPicker = false
  @state() private showYearPicker = false
  @state() private yearRangeStart = new Date().getFullYear() - 5
  @state() private isFlipped = false
  @state() private alignRight = false

  @query('.datetime-display') private displayEl!: HTMLDivElement
  @query('.dropdown') private dropdownEl?: HTMLDivElement

  private inputId = `datetime-picker-${Math.random().toString(36).substring(2, 9)}`
  private weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  private monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
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
      min-width: 0;
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
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .datetime-display:hover:not(.datetime-disabled) {
      border-color: var(--color-border-hover);
    }

    .datetime-display:focus-visible {
      outline: none;
    }

    .datetime-display--open {
      border-color: var(--color-border-focus);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .datetime-display--empty {
      color: var(--color-text-muted);
    }

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
      display: flex;
      align-items: center;
    }

    .datetime-icon base-icon,
    .datetime-icon svg {
      width: 1.25em;
      height: 1.25em;
      display: block;
    }

    /* Dropdown */
    .dropdown-overlay {
      position: fixed;
      inset: 0;
      z-index: 999;
      background: transparent;
    }

    .dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      min-width: 280px;
      max-width: calc(100vw - var(--space-4));
      background: var(--color-bg-primary);
      border: 1px solid var(--color-border-focus);
      border-radius: var(--radius-md);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
        0 2px 4px -1px rgba(0, 0, 0, 0.06);
      z-index: 1000;
      padding: var(--space-3);
      display: flex;
      flex-direction: column;
    }

    .dropdown--flipped {
      top: auto;
      bottom: calc(100% + 4px);
    }

    .dropdown--align-right {
      left: auto;
      right: 0;
    }

    /* Calendar */
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

    /* Overlay pickers (month/year) */
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
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .month-picker-grid,
    .year-picker-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-2);
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

    .year-picker-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-3);
      padding: var(--space-2);
      border-bottom: 1px solid var(--color-border);
    }

    .year-range {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
    }

    /* Time selector */
    .time-selectors {
      display: flex;
      gap: var(--space-2);
      align-items: stretch;
    }

    .time-column {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
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
      scrollbar-width: none;
    }

    .time-scroll::-webkit-scrollbar {
      display: none;
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

    .dropdown-footer {
      margin-top: var(--space-2);
      padding-top: var(--space-2);
      border-top: 1px solid var(--color-border);
      display: flex;
      justify-content: center;
    }

    .now-btn {
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

    .now-btn:hover {
      background-color: var(--color-bg-secondary);
      color: var(--color-primary);
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
    this.syncDraftFromValue()
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('value')) {
      this.syncDraftFromValue()
    }
    if (
      (changedProperties.has('step') || changedProperties.has('isOpen')) &&
      this.isOpen &&
      this.step === 'time'
    ) {
      requestAnimationFrame(() => this.scrollTimeSelectionsIntoView())
    }
  }

  private scrollTimeSelectionsIntoView() {
    const scrolls = this.renderRoot.querySelectorAll<HTMLElement>('.time-scroll')
    scrolls.forEach(scroll => {
      const selected = scroll.querySelector<HTMLElement>('.time-option--selected')
      if (!selected) return
      scroll.scrollTop = selected.offsetTop - scroll.clientHeight / 2 + selected.clientHeight / 2
    })
  }

  private syncDraftFromValue() {
    if (!this.value) {
      this.draftDate = ''
      return
    }
    const [datePart, timePart] = this.value.split('T')
    this.draftDate = datePart || ''
    if (datePart) {
      const d = new Date(datePart + 'T00:00:00')
      if (!isNaN(d.getTime())) {
        this.currentMonth = d.getMonth()
        this.currentYear = d.getFullYear()
      }
    }
    if (timePart) {
      const [h, m] = timePart.split(':').map(Number)
      if (!isNaN(h) && !isNaN(m)) {
        this.draftMinute = m
        if (this.format === '12') {
          if (h === 0) {
            this.draftHour = 12
            this.draftPeriod = 'AM'
          } else if (h < 12) {
            this.draftHour = h
            this.draftPeriod = 'AM'
          } else if (h === 12) {
            this.draftHour = 12
            this.draftPeriod = 'PM'
          } else {
            this.draftHour = h - 12
            this.draftPeriod = 'PM'
          }
        } else {
          this.draftHour = h
        }
      }
    }
  }

  private formatDateTime(datePart: string, timePart: string): string {
    if (!datePart) return ''
    const d = new Date(datePart + 'T' + (timePart || '00:00'))
    if (isNaN(d.getTime())) return `${datePart}${timePart ? 'T' + timePart : ''}`
    const dateStr = d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    if (!timePart) return dateStr
    const timeStr =
      this.format === '12'
        ? d.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })
        : d.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
    return `${dateStr}, ${timeStr}`
  }

  private get displayValue(): string {
    if (this.isOpen && this.draftDate) {
      return this.formatDateTime(this.draftDate, this.draftTime24)
    }
    if (!this.value) return ''
    const [datePart, timePart] = this.value.split('T')
    return this.formatDateTime(datePart, timePart || '')
  }

  private get hasDisplayContent(): boolean {
    return !!(this.value || (this.isOpen && this.draftDate))
  }

  private get currentMonthName(): string {
    return new Date(this.currentYear, this.currentMonth).toLocaleDateString('en-US', {
      month: 'long',
    })
  }

  private get yearRangeEnd(): number {
    return this.yearRangeStart + 11
  }

  private get yearRange(): number[] {
    const years: number[] = []
    for (let i = this.yearRangeStart; i <= this.yearRangeEnd; i++) years.push(i)
    return years
  }

  private get calendarDays(): (number | null)[] {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1)
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0)
    const startPadding = firstDay.getDay()
    const daysInMonth = lastDay.getDate()
    const days: (number | null)[] = []
    for (let i = 0; i < startPadding; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    while (days.length < 42) days.push(null)
    return days.slice(0, 42)
  }

  private get hours(): number[] {
    return this.format === '12'
      ? Array.from({ length: 12 }, (_, i) => i + 1)
      : Array.from({ length: 24 }, (_, i) => i)
  }

  private get minutes(): number[] {
    return Array.from({ length: 60 }, (_, i) => i)
  }

  private get draftTime24(): string {
    let h = this.draftHour
    if (this.format === '12') {
      if (this.draftPeriod === 'AM') {
        h = this.draftHour === 12 ? 0 : this.draftHour
      } else {
        h = this.draftHour === 12 ? 12 : this.draftHour + 12
      }
    }
    return `${String(h).padStart(2, '0')}:${String(this.draftMinute).padStart(2, '0')}`
  }

  private handleDisplayClick() {
    if (this.disabled) return
    this.toggleDropdown()
  }

  private toggleDropdown() {
    if (this.isOpen) {
      this.closeDropdown()
    } else {
      this.syncDraftFromValue()
      this.step = 'date'
      this.showMonthPicker = false
      this.showYearPicker = false
      this.isOpen = true
      requestAnimationFrame(() => this.updateDropdownPosition())
    }
  }

  private updateDropdownPosition() {
    if (!this.dropdownEl || !this.displayEl) return
    const rect = this.displayEl.getBoundingClientRect()
    const dropdownHeight = 480
    const dropdownWidth = 320
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const spaceRight = window.innerWidth - rect.left
    const spaceLeft = rect.right
    this.isFlipped = spaceBelow < dropdownHeight && spaceAbove > spaceBelow
    this.alignRight = spaceRight < dropdownWidth && spaceLeft > spaceRight
  }

  private closeDropdown() {
    this.isOpen = false
    this.isFlipped = false
    this.alignRight = false
    this.showMonthPicker = false
    this.showYearPicker = false
    this.step = 'date'
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
    if (!this.draftDate) return false
    const d = new Date(this.draftDate + 'T00:00:00')
    return (
      d.getDate() === day &&
      d.getMonth() === this.currentMonth &&
      d.getFullYear() === this.currentYear
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

  private isDateDisabled(day: number): boolean {
    const date = new Date(this.currentYear, this.currentMonth, day)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const dayStr = String(date.getDate()).padStart(2, '0')
    const iso = `${year}-${month}-${dayStr}`
    if (this.minDate && iso < this.minDate) return true
    if (this.maxDate && iso > this.maxDate) return true
    return false
  }

  private selectDate(day: number) {
    if (this.isDateDisabled(day)) return
    const d = new Date(this.currentYear, this.currentMonth, day)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const dayStr = String(d.getDate()).padStart(2, '0')
    this.draftDate = `${year}-${month}-${dayStr}`
    this.step = 'time'
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

  private yearRangeBack(e: Event) {
    e.stopPropagation()
    this.yearRangeStart -= 12
  }

  private yearRangeForward(e: Event) {
    e.stopPropagation()
    this.yearRangeStart += 12
  }

  private selectHour(h: number) {
    this.draftHour = h
  }

  private selectMinute(m: number) {
    this.draftMinute = m
  }

  private selectPeriod(p: 'AM' | 'PM') {
    this.draftPeriod = p
  }

  private selectNow() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    this.draftDate = `${year}-${month}-${day}`
    this.currentMonth = now.getMonth()
    this.currentYear = now.getFullYear()

    const h = now.getHours()
    this.draftMinute = now.getMinutes()
    if (this.format === '12') {
      if (h === 0) {
        this.draftHour = 12
        this.draftPeriod = 'AM'
      } else if (h < 12) {
        this.draftHour = h
        this.draftPeriod = 'AM'
      } else if (h === 12) {
        this.draftHour = 12
        this.draftPeriod = 'PM'
      } else {
        this.draftHour = h - 12
        this.draftPeriod = 'PM'
      }
    } else {
      this.draftHour = h
    }
    if (this.step === 'date') this.step = 'time'
  }

  private commitAndClose() {
    if (this.draftDate) {
      const newValue = `${this.draftDate}T${this.draftTime24}`
      if (newValue !== this.value) {
        const oldValue = this.value
        this.value = newValue
        this.dispatchEvent(
          new CustomEvent('change', {
            detail: { value: newValue, oldValue },
            bubbles: true,
            composed: true,
          })
        )
      }
    }
    this.closeDropdown()
  }

  private handleKeydown(event: KeyboardEvent) {
    if (this.disabled) return
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault()
        this.toggleDropdown()
        break
      case 'Escape':
        event.preventDefault()
        if (this.isOpen) this.commitAndClose()
        break
    }
  }

  private renderCalendar() {
    if (this.showMonthPicker) {
      return html`
        <div class="picker-overlay">
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
      `
    }

    if (this.showYearPicker) {
      return html`
        <div class="picker-overlay">
          <div class="year-picker-header">
            <button type="button" class="calendar-nav" @click=${this.yearRangeBack}>‹</button>
            <span class="year-range">${this.yearRangeStart} - ${this.yearRangeEnd}</span>
            <button type="button" class="calendar-nav" @click=${this.yearRangeForward}>›</button>
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
      `
    }

    return html`
      <div class="calendar-header">
        <button type="button" class="calendar-nav" @click=${this.previousMonth}>‹</button>
        <div class="calendar-month-year">
          <span class="month-selector" @click=${() => (this.showMonthPicker = true)}>
            ${this.currentMonthName}
          </span>
          <span class="year-selector" @click=${() => (this.showYearPicker = true)}>
            ${this.currentYear}
          </span>
        </div>
        <button type="button" class="calendar-nav" @click=${this.nextMonth}>›</button>
      </div>

      <div class="calendar-weekdays">
        ${this.weekDays.map(day => html`<div class="calendar-weekday">${day}</div>`)}
      </div>

      <div class="calendar-days">
        ${this.calendarDays.map(day =>
          day
            ? html`
                <div
                  class=${classMap({
                    'calendar-day': true,
                    'day-selected': this.isSelectedDate(day),
                    'day-today': this.isToday(day),
                    'day-disabled': this.isDateDisabled(day),
                  })}
                  @click=${() => this.selectDate(day)}
                >
                  ${day}
                </div>
              `
            : html`<div class="calendar-day day-empty"></div>`
        )}
      </div>
    `
  }

  private renderTime() {
    return html`
      <div class="time-selectors">
        <div class="time-column">
          <div class="time-column-label">Hour</div>
          <div class="time-scroll">
            ${this.hours.map(
              hour => html`
                <div
                  class=${classMap({
                    'time-option': true,
                    'time-option--selected': hour === this.draftHour,
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
                    'time-option--selected': minute === this.draftMinute,
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
                  ${(['AM', 'PM'] as const).map(
                    period => html`
                      <div
                        class=${classMap({
                          'time-option': true,
                          'time-option--selected': period === this.draftPeriod,
                        })}
                        @click=${() => this.selectPeriod(period)}
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
    `
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
      'datetime-display--empty': !this.hasDisplayContent,
      'datetime-disabled': this.disabled,
    }
    const dropdownClasses = {
      dropdown: true,
      'dropdown--flipped': this.isFlipped,
      'dropdown--align-right': this.alignRight,
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
            <base-icon name="calendar-day" size="20px"></base-icon>
          </div>

          ${this.isOpen
            ? html`
                <div class="dropdown-overlay" @click=${this.commitAndClose}></div>
                <div class=${classMap(dropdownClasses)} role="dialog" aria-label="Choose date and time">
                  ${this.step === 'date' ? this.renderCalendar() : this.renderTime()}
                  <div class="dropdown-footer">
                    <button type="button" class="now-btn" @click=${this.selectNow}>Now</button>
                  </div>
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
            ? html`<div class="datetime-picker-hint">${this.hint}</div>`
            : ''}
      </div>
    `
  }
}
