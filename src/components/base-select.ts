import { css, html } from 'lit'
import { property, query, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { BaseElement } from '../base-element'
import { register } from '../helpers/register'

export interface SelectOption {
  label: string
  value: string
}

type SelectSize = 'xs' | 'sm' | 'md' | 'lg'

export const registerBaseSelect = () => register({
  name: 'base-select',
  element: BaseSelect
})
export class BaseSelect extends BaseElement {
  @property({
    type: String,
    converter: {
      fromAttribute: (value: string | null) => {
        if (!value) return ''
        try {
          const parsed = JSON.parse(value)
          return Array.isArray(parsed) ? parsed : value
        } catch {
          return value
        }
      },
      toAttribute: (value: string | string[]) => {
        return Array.isArray(value) ? JSON.stringify(value) : value
      }
    }
  })
  value: string | string[] = ''
  @property({ type: Boolean, reflect: true }) multiple = false
  @property({ type: String }) label?: string
  @property({ type: String }) placeholder = 'Select an option'
  @property({ type: Boolean, reflect: true }) required = false
  @property({ type: Boolean, reflect: true }) disabled = false
  @property({ type: Boolean, reflect: true }) searchable = false
  @property({ type: Boolean, reflect: true }) creatable = false
  @property({ type: String }) error?: string
  @property({ type: String }) hint?: string
  @property({ type: String }) size: SelectSize = 'md'
  @property({ type: Array }) options: SelectOption[] = []

  @state() private isOpen = false
  @state() private parsedFromSlot = false
  @state() private searchQuery = ''
  @state() private highlightedIndex = -1
  @state() private isFlipped = false
  @state() private alignRight = false
  @state() private srAnnouncement = ''
  @state() private selectedValuesSet = new Set<string>()

  @query('.select-input') private selectInput!: HTMLInputElement
  @query('.select-display') private selectDisplay!: HTMLDivElement
  @query('.dropdown-options') private dropdownElement!: HTMLDivElement

  private selectId = `select-${Math.random().toString(36).substr(2, 9)}`

  connectedCallback() {
    super.connectedCallback()
    this.parseSlottedOptions()
  }

  willUpdate(changedProperties: Map<string, unknown>) {
    super.willUpdate(changedProperties)

    // Handle mode switching between single and multiple
    if (changedProperties.has('multiple')) {
      if (!this.multiple && Array.isArray(this.value)) {
        // multiple → single: keep first value
        this.value = this.value[0] || ''
      } else if (this.multiple && typeof this.value === 'string') {
        // single → multiple: convert to array
        this.value = this.value ? [this.value] : []
      }
    }

    // Performance: update selectedValuesSet for fast lookup
    if (changedProperties.has('value')) {
      this.selectedValuesSet = new Set(this.selectedValues)
    }
  }

  private parseSlottedOptions() {
    // Only parse from slot if options weren't set programmatically
    if (this.options.length === 0 && !this.parsedFromSlot) {
      const optionElements = this.querySelectorAll('option')
      if (optionElements.length > 0) {
        this.options = Array.from(optionElements).map(option => ({
          label: option.textContent?.trim() || option.value,
          value: option.value
        }))

        // Set initial value from selected option
        if (this.multiple) {
          const selectedOptions = Array.from(optionElements).filter(opt => opt.hasAttribute('selected'))
          if (selectedOptions.length > 0 && (!this.value || (Array.isArray(this.value) && this.value.length === 0))) {
            this.value = selectedOptions.map(opt => opt.value)
          }
        } else {
          const selectedOption = Array.from(optionElements).find(opt => opt.hasAttribute('selected'))
          if (selectedOption && !this.value) {
            this.value = selectedOption.value
          }
        }

        this.parsedFromSlot = true
      }
    }
  }

  private get selectedValues(): string[] {
    if (Array.isArray(this.value)) return this.value
    return this.value ? [this.value] : []
  }

  private get selectedValue(): string {
    if (Array.isArray(this.value)) return this.value[0] || ''
    return this.value
  }

  private get selectedOptions(): SelectOption[] {
    return this.options.filter(opt => this.selectedValues.includes(opt.value))
  }

  private isOptionSelected(value: string): boolean {
    return this.selectedValuesSet.has(value)
  }

  static styles = css`
    :host {
      display: block;
      position: relative;
    }

    .select-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .select-label {
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

    .select-wrapper {
      position: relative;
    }

    .select-input,
    .select-display {
      width: 100%;
      font-family: var(--font-family-sans);
      background-color: var(--color-bg-primary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      transition: all var(--transition-fast);
      color: var(--color-text-primary);
      box-sizing: border-box;
    }

    .select-input {
      cursor: text;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      opacity: 0;
      pointer-events: none;
      height: 100%;
      margin: 0;
      line-height: inherit;
    }

    .select-input--visible {
      opacity: 1;
      pointer-events: auto;
      z-index: 1;
    }

    .select-display {
      cursor: pointer;
      user-select: none;
      display: flex;
      align-items: center;
    }

    .select-display--hidden {
      opacity: 0;
      pointer-events: none;
    }

    .select-input:hover:not(:disabled),
    .select-display:hover:not(.select-disabled) {
      border-color: var(--color-border-hover);
    }

    .select-input:focus,
    .select-display--open {
      outline: none;
      border-color: var(--color-border-focus);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .select-input::placeholder {
      color: var(--color-text-muted);
    }

    /* Sizes */
    .select--xs .select-input,
    .select--xs .select-display,
    .select--xs .chips-wrapper {
      padding: var(--space-1) var(--space-2);
      font-size: var(--font-size-xs);
    }

    .select--xs .select-input,
    .select--xs .select-display,
    .select--xs .chips-wrapper {
      padding-right: var(--space-6);
    }

    .select--sm .select-input,
    .select--sm .select-display,
    .select--sm .chips-wrapper {
      padding: var(--space-2) var(--space-3);
      font-size: var(--font-size-sm);
    }

    .select--sm .select-input,
    .select--sm .select-display,
    .select--sm .chips-wrapper {
      padding-right: var(--space-8);
    }

    .select--md .select-input,
    .select--md .select-display,
    .select--md .chips-wrapper {
      padding: var(--space-3) var(--space-4);
      font-size: var(--font-size-base);
    }

    .select--md .select-input,
    .select--md .select-display,
    .select--md .chips-wrapper {
      padding-right: var(--space-10);
    }

    .select--lg .select-input,
    .select--lg .select-display,
    .select--lg .chips-wrapper {
      padding: var(--space-4) var(--space-5);
      font-size: var(--font-size-lg);
    }

    .select--lg .select-input,
    .select--lg .select-display,
    .select--lg .chips-wrapper {
      padding-right: var(--space-12);
    }

    .select--xs .dropdown-option,
    .select--xs .dropdown-no-results,
    .select--xs .dropdown-create-button,
    .select--xs .chips-search-input,
    .select--xs .chips-placeholder,
    .select--xs .chip {
      font-size: var(--font-size-xs);
    }

    .select--sm .dropdown-option,
    .select--sm .dropdown-no-results,
    .select--sm .dropdown-create-button,
    .select--sm .chips-search-input,
    .select--sm .chips-placeholder,
    .select--sm .chip {
      font-size: var(--font-size-sm);
    }

    .select--md .dropdown-option,
    .select--md .dropdown-no-results,
    .select--md .dropdown-create-button,
    .select--md .chips-search-input,
    .select--md .chips-placeholder,
    .select--md .chip {
      font-size: var(--font-size-base);
    }

    .select--lg .dropdown-option,
    .select--lg .dropdown-no-results,
    .select--lg .dropdown-create-button,
    .select--lg .chips-search-input,
    .select--lg .chips-placeholder,
    .select--lg .chip {
      font-size: var(--font-size-lg);
    }

    /* States */
    .select--error .select-input,
    .select--error .select-display {
      border-color: var(--color-error);
    }

    .select--error .select-input:focus,
    .select--error .select-display--open {
      border-color: var(--color-error);
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }

    .select-disabled {
      opacity: 0.5;
      cursor: not-allowed !important;
      background-color: var(--color-bg-muted);
    }

    .select-chevron {
      position: absolute;
      right: var(--space-3);
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-text-secondary);
      pointer-events: none;
      transition: transform var(--transition-fast);
    }

    .select-chevron--open {
      transform: translateY(-50%) rotate(180deg);
    }

    .select-chevron svg {
      width: 1em;
      height: 1em;
      display: block;
    }

    /* Multiple select chips */
    .chips-wrapper {
      width: 100%;
      font-family: var(--font-family-sans);
      background-color: var(--color-bg-primary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      transition: all var(--transition-fast);
      color: var(--color-text-primary);
      box-sizing: border-box;
      cursor: pointer;
      display: flex;
      align-items: flex-start;
      position: relative;
    }

    .chips-wrapper--has-clear {
      padding-right: var(--space-12);
    }

    .select--xs .chips-wrapper--has-clear {
      padding-right: var(--space-8);
    }

    .select--sm .chips-wrapper--has-clear {
      padding-right: var(--space-10);
    }

    .select--md .chips-wrapper--has-clear {
      padding-right: var(--space-12);
    }

    .select--lg .chips-wrapper--has-clear {
      padding-right: var(--space-16);
    }

    .chips-wrapper:hover:not(.select-disabled) {
      border-color: var(--color-border-hover);
    }

    .chips-wrapper:focus {
      outline: none;
      border-color: var(--color-border-focus);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1);
      flex: 1;
      min-height: 28px;
      max-height: 120px;
      overflow-y: auto;
      align-items: center;
      padding: 0;
    }

    .chips-container--open {
      border-color: var(--color-border-focus);
    }

    .chips-placeholder {
      color: var(--color-text-muted);
      padding: var(--space-1) var(--space-2);
      pointer-events: none;
    }

    .chip {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      padding: 0 var(--space-1) 0 var(--space-2);
      background: var(--color-bg-secondary);
      color: var(--color-text-primary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      line-height: 1.5;
      font-weight: var(--font-weight-medium);
      transition: all var(--transition-fast);
      height: 28px;
    }

    .chip:hover {
      border-color: var(--color-border-hover);
      background: var(--color-bg-tertiary);
    }

    .chip-label {
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .chip-remove {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      margin: 0;
      margin-left: var(--space-1);
      background: transparent;
      border: none;
      color: var(--color-text-secondary);
      cursor: pointer;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      border-radius: var(--radius-sm);
      transition: all var(--transition-fast);
    }

    .chip-remove:hover {
      background: rgba(0, 0, 0, 0.1);
      color: var(--color-text-primary);
    }

    .chip-remove:active {
      background: rgba(0, 0, 0, 0.15);
    }

    .chip-remove svg {
      width: 12px;
      height: 12px;
    }

    .chips-search-input {
      flex: 1;
      min-width: 0;
      border: none;
      outline: none;
      background: transparent;
      font-family: var(--font-family-sans);
      color: var(--color-text-primary);
      padding: var(--space-1) var(--space-2);
      box-sizing: border-box;
    }

    .chips-search-input::placeholder {
      color: var(--color-text-muted);
    }

    .chips-search-input:focus {
      outline: none;
    }

    .chips-wrapper--search-active {
      border-color: var(--color-border-focus);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .clear-all-button {
      position: absolute;
      right: var(--space-8);
      top: 50%;
      transform: translateY(-50%);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-1);
      background: transparent;
      border: none;
      color: var(--color-text-secondary);
      cursor: pointer;
      border-radius: var(--radius-sm);
      transition: all var(--transition-fast);
      z-index: 3;
      width: 24px;
      height: 24px;
    }

    .clear-all-button:hover {
      color: var(--color-text-primary);
    }

    .clear-all-button:active {
      color: var(--color-text-secondary);
    }

    .clear-all-button svg {
      display: block;
      width: 14px;
      height: 14px;
    }

    .select--xs .clear-all-button {
      right: var(--space-5);
    }

    .select--sm .clear-all-button {
      right: var(--space-6);
    }

    .select--md .clear-all-button {
      right: var(--space-8);
    }

    .select--lg .clear-all-button {
      right: var(--space-10);
    }

    /* Dropdown */
    .dropdown-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 999;
      background: transparent;
    }

    .dropdown-options {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      max-height: 240px;
      overflow-y: auto;
      background: var(--color-bg-primary);
      border: 1px solid var(--color-border-focus);
      border-radius: var(--radius-md);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      z-index: 1000;
    }

    .dropdown-options--flipped {
      top: auto;
      bottom: calc(100% + 4px);
    }

    .dropdown-options--align-right {
      left: auto;
      right: 0;
    }

    .dropdown-option {
      padding: var(--space-3);
      cursor: pointer;
      transition: background-color var(--transition-fast);
      color: var(--color-text-primary);
    }

    .dropdown-option:hover,
    .dropdown-option--highlighted {
      background-color: var(--color-bg-secondary);
    }

    .dropdown-option--selected {
      background-color: var(--color-bg-tertiary);
      font-weight: var(--font-weight-medium);
    }

    .dropdown-option--selected:hover,
    .dropdown-option--selected.dropdown-option--highlighted {
      background-color: var(--color-bg-tertiary);
    }

    .dropdown-no-results {
      padding: var(--space-3);
      color: var(--color-text-secondary);
      text-align: center;
    }

    .dropdown-create-button {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3);
      cursor: pointer;
      transition: background-color var(--transition-fast);
      color: var(--color-text-primary);
      background: transparent;
      border: none;
      width: 100%;
      text-align: left;
      font-family: var(--font-family-sans);
    }

    .dropdown-create-button:hover {
      background-color: var(--color-bg-secondary);
    }

    .dropdown-create-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: var(--radius-sm);
      background-color: var(--color-bg-tertiary);
      flex-shrink: 0;
    }

    .dropdown-create-icon svg {
      width: 14px;
      height: 14px;
    }

    .dropdown-create-label {
      flex: 1;
      font-weight: var(--font-weight-medium);
    }

    .select-error {
      font-size: var(--font-size-sm);
      color: var(--color-error);
      line-height: var(--line-height-tight);
    }

    .select-hint {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      line-height: var(--line-height-tight);
    }

    /* Screen reader only */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }

    /* Hidden slot for option elements */
    ::slotted(option) {
      display: none;
    }
  `

  private get selectedOption(): SelectOption | undefined {
    return this.options.find(opt => opt.value === this.value)
  }

  private get displayValue(): string {
    return this.selectedOption?.label || this.placeholder
  }

  private get filteredOptions(): SelectOption[] {
    if (!this.searchable || !this.searchQuery.trim()) {
      return this.options
    }

    const query = this.searchQuery.toLowerCase()
    return this.options.filter(
      option =>
        option.label.toLowerCase().includes(query) ||
        option.value.toLowerCase().includes(query)
    )
  }

  private handleDisplayClick() {
    if (this.disabled) return
    this.toggleDropdown()
  }

  private toggleDropdown() {
    this.isOpen = !this.isOpen
    if (this.isOpen) {
      this.highlightedIndex = this.filteredOptions.findIndex(
        opt => opt.value === this.value
      )
      if (this.searchable) {
        requestAnimationFrame(() => {
          this.selectInput?.focus()
        })
      }
      requestAnimationFrame(() => this.updateDropdownPosition())
    } else {
      this.searchQuery = ''
      this.highlightedIndex = -1
    }
  }

  private updateDropdownPosition() {
    if (!this.dropdownElement || !this.selectDisplay) return

    const displayRect = this.selectDisplay.getBoundingClientRect()
    const dropdownHeight = 240 // max-height from CSS
    const spaceBelow = window.innerHeight - displayRect.bottom
    const spaceAbove = displayRect.top
    const spaceRight = window.innerWidth - displayRect.left
    const spaceLeft = displayRect.right

    this.isFlipped = spaceBelow < dropdownHeight && spaceAbove > spaceBelow
    this.alignRight = spaceRight < displayRect.width && spaceLeft > spaceRight
  }

  private closeDropdown() {
    this.isOpen = false
    this.searchQuery = ''
    this.highlightedIndex = -1
    this.isFlipped = false
    this.alignRight = false
  }

  private handleSearchInput(event: Event) {
    const target = event.target as HTMLInputElement
    this.searchQuery = target.value
    this.highlightedIndex = 0
  }

  private selectOption(option: SelectOption) {
    if (this.multiple) {
      this.toggleMultipleOption(option)
    } else {
      this.selectSingleOption(option)
    }
  }

  private createAndSelectOption(label: string) {
    // Create new option with label as both label and value
    const newOption: SelectOption = {
      label: label,
      value: label
    }

    // Add to options array
    this.options = [...this.options, newOption]

    // Clear search query
    this.searchQuery = ''

    // Select the new option
    this.selectOption(newOption)
  }

  private selectSingleOption(option: SelectOption) {
    const oldValue = this.value

    this.value = option.value

    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: option.value, oldValue },
        bubbles: true,
        composed: true,
      })
    )

    this.closeDropdown()
  }

  private toggleMultipleOption(option: SelectOption) {
    const currentValues = this.selectedValues
    const index = currentValues.indexOf(option.value)
    const oldValues = [...currentValues]

    let newValues: string[]
    let added: string[] = []
    let removed: string[] = []

    if (index > -1) {
      // Remove the option
      newValues = currentValues.filter(v => v !== option.value)
      removed = [option.value]
      this.announceToScreenReader(`Removed ${option.label}`)
    } else {
      // Add the option
      newValues = [...currentValues, option.value]
      added = [option.value]
      this.announceToScreenReader(`Added ${option.label}. ${newValues.length} item${newValues.length !== 1 ? 's' : ''} selected`)
    }

    this.value = newValues

    this.dispatchEvent(
      new CustomEvent('change', {
        detail: {
          values: newValues,
          oldValues,
          added,
          removed,
          value: newValues[0] || '' // backwards compat
        },
        bubbles: true,
        composed: true,
      })
    )

    // Keep dropdown open - don't call closeDropdown()
  }

  private handleChipRemove(event: Event, valueToRemove: string) {
    event.stopPropagation()
    if (this.disabled) return

    const currentValues = this.selectedValues
    const oldValues = [...currentValues]
    const newValues = currentValues.filter(v => v !== valueToRemove)
    const removedOption = this.options.find(opt => opt.value === valueToRemove)

    this.value = newValues

    this.dispatchEvent(
      new CustomEvent('change', {
        detail: {
          values: newValues,
          oldValues,
          added: [],
          removed: [valueToRemove],
          value: newValues[0] || ''
        },
        bubbles: true,
        composed: true,
      })
    )

    if (removedOption) {
      this.announceToScreenReader(`Removed ${removedOption.label}`)
    }
  }

  private handleClearAll(event: Event) {
    event.stopPropagation()
    if (this.disabled) return

    const oldValues = this.selectedValues
    this.value = []

    this.dispatchEvent(
      new CustomEvent('change', {
        detail: {
          values: [],
          oldValues,
          added: [],
          removed: oldValues,
          value: ''
        },
        bubbles: true,
        composed: true,
      })
    )

    this.announceToScreenReader('Cleared all selections')
  }

  private announceToScreenReader(message: string) {
    this.srAnnouncement = message
    setTimeout(() => {
      this.srAnnouncement = ''
    }, 1000)
  }

  private renderChip(option: SelectOption) {
    return html`
      <div class="chip" role="listitem">
        <span class="chip-label">${option.label}</span>
        <button
          type="button"
          class="chip-remove"
          aria-label="Remove ${option.label}"
          tabindex="-1"
          @click=${(e: Event) => this.handleChipRemove(e, option.value)}
        >
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
          </svg>
        </button>
      </div>
    `
  }

  private handleKeydown(event: KeyboardEvent) {
    if (this.disabled) return

    switch (event.key) {
      case 'Enter':
        event.preventDefault()
        if (this.isOpen) {
          if (this.highlightedIndex >= 0 && this.highlightedIndex < this.filteredOptions.length) {
            this.selectOption(this.filteredOptions[this.highlightedIndex])
            // In single mode, dropdown closes automatically via selectSingleOption
            // In multiple mode, dropdown stays open
          } else if (this.creatable && this.searchable && this.searchQuery.trim() && this.filteredOptions.length === 0) {
            // Create new option when no matches found
            this.createAndSelectOption(this.searchQuery.trim())
          }
        } else {
          this.toggleDropdown()
        }
        break

      case 'Escape':
        event.preventDefault()
        this.closeDropdown()
        break

      case 'ArrowDown':
        event.preventDefault()
        if (!this.isOpen) {
          this.toggleDropdown()
        } else {
          this.highlightedIndex = Math.min(
            this.highlightedIndex + 1,
            this.filteredOptions.length - 1
          )
          this.scrollToHighlighted()
        }
        break

      case 'ArrowUp':
        event.preventDefault()
        if (this.isOpen) {
          this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0)
          this.scrollToHighlighted()
        }
        break

      case ' ':
        if (!this.searchable) {
          event.preventDefault()
          if (this.isOpen && this.multiple) {
            // In multiple mode with dropdown open, toggle the highlighted option
            if (this.highlightedIndex >= 0 && this.highlightedIndex < this.filteredOptions.length) {
              this.selectOption(this.filteredOptions[this.highlightedIndex])
            }
          } else if (!this.isOpen) {
            this.toggleDropdown()
          }
        }
        break

      case 'Backspace':
        // In multiple mode, remove last chip if search is empty
        if (this.multiple && this.searchable && this.searchQuery === '' && this.selectedValues.length > 0) {
          event.preventDefault()
          const lastValue = this.selectedValues[this.selectedValues.length - 1]
          const lastOption = this.options.find(opt => opt.value === lastValue)
          if (lastOption) {
            this.handleChipRemove(event, lastValue)
          }
        }
        break
    }
  }

  private scrollToHighlighted() {
    if (this.highlightedIndex < 0) return

    requestAnimationFrame(() => {
      const options = this.dropdownElement?.querySelectorAll('.dropdown-option')
      const highlighted = options?.[this.highlightedIndex] as HTMLElement
      if (highlighted && this.dropdownElement) {
        const dropdownRect = this.dropdownElement.getBoundingClientRect()
        const optionRect = highlighted.getBoundingClientRect()

        if (optionRect.bottom > dropdownRect.bottom) {
          highlighted.scrollIntoView({ block: 'end', behavior: 'smooth' })
        } else if (optionRect.top < dropdownRect.top) {
          highlighted.scrollIntoView({ block: 'start', behavior: 'smooth' })
        }
      }
    })
  }

  render() {
    const hasError = !!this.error
    const wrapperClasses = {
      'select-wrapper': true,
      [`select--${this.size}`]: true,
      'select--error': hasError,
    }

    const displayClasses = {
      'select-display': true,
      'select-display--open': this.isOpen,
      'select-display--hidden': this.searchable && this.isOpen,
      'select-disabled': this.disabled,
    }

    const inputClasses = {
      'select-input': true,
      'select-input--visible': this.searchable && this.isOpen,
      'select-disabled': this.disabled,
    }

    return html`
      <div class="select-group">
        ${this.label
          ? html`
              <label for=${this.selectId} class="select-label">
                ${this.label}
                ${this.required
                  ? html`<span class="required-indicator" aria-label="required">*</span>`
                  : ''}
              </label>
            `
          : ''}

        <div class=${classMap(wrapperClasses)}>
          ${this.multiple
            ? html`
                <!-- Multiple select mode with chips -->
                <div
                  id=${this.selectId}
                  class="chips-wrapper ${this.disabled ? 'select-disabled' : ''} ${this.searchable && this.isOpen ? 'chips-wrapper--search-active' : ''} ${this.selectedValues.length > 0 && !this.disabled ? 'chips-wrapper--has-clear' : ''}"
                  @click=${this.handleDisplayClick}
                  @keydown=${this.searchable ? undefined : this.handleKeydown}
                  tabindex=${this.searchable ? -1 : (this.disabled ? -1 : 0)}
                  role="combobox"
                  aria-expanded=${this.isOpen}
                  aria-haspopup="listbox"
                  aria-multiselectable="true"
                  aria-describedby=${ifDefined(hasError ? `${this.selectId}-error` : undefined)}
                  aria-invalid=${hasError}
                >
                  <div class="chips-container ${this.isOpen && !this.searchable ? 'chips-container--open' : ''}" role="list">
                    ${this.selectedOptions.map(opt => this.renderChip(opt))}
                    ${this.searchable
                      ? html`
                          <input
                            id="${this.selectId}-input"
                            class="chips-search-input"
                            type="text"
                            placeholder=${this.selectedValues.length === 0 ? this.placeholder : 'Search...'}
                            ?disabled=${this.disabled}
                            .value=${this.searchQuery}
                            @input=${this.handleSearchInput}
                            @keydown=${this.handleKeydown}
                            @click=${(e: Event) => e.stopPropagation()}
                            @focus=${() => { if (!this.isOpen) this.toggleDropdown() }}
                          />
                        `
                      : html`${this.selectedOptions.length === 0 ? html`<span class="chips-placeholder">${this.placeholder}</span>` : ''}`}
                  </div>
                </div>
                ${this.selectedValues.length > 0 && !this.disabled
                  ? html`
                      <button
                        type="button"
                        class="clear-all-button"
                        aria-label="Clear all selections"
                        @click=${this.handleClearAll}
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor">
                          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
                        </svg>
                      </button>
                    `
                  : ''}
              `
            : html`
                <!-- Single select mode (original) -->
                <input
                  id="${this.selectId}-input"
                  class=${classMap(inputClasses)}
                  type="text"
                  placeholder=${this.displayValue}
                  ?disabled=${this.disabled}
                  .value=${this.searchQuery}
                  @input=${this.handleSearchInput}
                  @keydown=${this.handleKeydown}
                  aria-describedby=${ifDefined(hasError ? `${this.selectId}-error` : undefined)}
                  aria-invalid=${hasError}
                />
                <div
                  id=${this.selectId}
                  class=${classMap(displayClasses)}
                  @click=${this.handleDisplayClick}
                  @keydown=${this.handleKeydown}
                  tabindex=${this.disabled ? -1 : 0}
                  role="combobox"
                  aria-expanded=${this.isOpen}
                  aria-haspopup="listbox"
                  aria-describedby=${ifDefined(hasError ? `${this.selectId}-error` : undefined)}
                  aria-invalid=${hasError}
                >
                  ${this.displayValue}
                </div>
              `}

          <div class=${classMap({ 'select-chevron': true, 'select-chevron--open': this.isOpen })}>
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </div>

          ${this.isOpen
            ? html`
                <div class="dropdown-overlay" @click=${this.closeDropdown}></div>
                <div
                  class=${classMap({
                    'dropdown-options': true,
                    'dropdown-options--flipped': this.isFlipped,
                    'dropdown-options--align-right': this.alignRight,
                  })}
                  role="listbox"
                  aria-multiselectable=${ifDefined(this.multiple ? 'true' : undefined)}
                >
                  ${this.filteredOptions.length === 0
                    ? this.creatable && this.searchable && this.searchQuery.trim()
                      ? html`
                          <button
                            type="button"
                            class="dropdown-create-button"
                            @click=${() => this.createAndSelectOption(this.searchQuery.trim())}
                          >
                            <div class="dropdown-create-icon">
                              <svg viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"/>
                              </svg>
                            </div>
                            <span class="dropdown-create-label">"${this.searchQuery.trim()}"</span>
                          </button>
                        `
                      : html` <div class="dropdown-no-results">No options found</div> `
                    : this.filteredOptions.map(
                        (option, index) => html`
                          <div
                            class=${classMap({
                              'dropdown-option': true,
                              'dropdown-option--selected': this.isOptionSelected(option.value),
                              'dropdown-option--highlighted': index === this.highlightedIndex,
                            })}
                            role="option"
                            aria-selected=${this.isOptionSelected(option.value)}
                            @click=${() => this.selectOption(option)}
                          >
                            ${option.label}
                          </div>
                        `
                      )}
                </div>
              `
            : ''}
        </div>

        ${hasError
          ? html`
              <div id="${this.selectId}-error" class="select-error" role="alert">
                ${this.error}
              </div>
            `
          : this.hint
            ? html` <div class="select-hint">${this.hint}</div> `
            : ''}

        <!-- Screen reader announcements -->
        <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
          ${this.srAnnouncement}
        </div>

        <!-- Hidden slot for option elements -->
        <slot @slotchange=${this.parseSlottedOptions}></slot>
      </div>
    `
  }
}
