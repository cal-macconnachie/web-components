import { css, html } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { BaseElement } from '../base-element'

export interface SelectOption {
  label: string
  value: string
}

type SelectSize = 'sm' | 'md' | 'lg'

@customElement('base-select')
export class BaseSelect extends BaseElement {
  @property({ type: String }) value = ''
  @property({ type: String }) label?: string
  @property({ type: String }) placeholder = 'Select an option'
  @property({ type: Boolean, reflect: true }) required = false
  @property({ type: Boolean, reflect: true }) disabled = false
  @property({ type: Boolean, reflect: true }) searchable = false
  @property({ type: String }) error?: string
  @property({ type: String }) hint?: string
  @property({ type: String }) size: SelectSize = 'md'
  @property({ type: Array }) options: SelectOption[] = []

  @state() private isOpen = false
  @state() private searchQuery = ''
  @state() private highlightedIndex = -1
  @state() private isFlipped = false
  @state() private alignRight = false

  @query('.select-input') private selectInput!: HTMLInputElement
  @query('.select-display') private selectDisplay!: HTMLDivElement
  @query('.dropdown-options') private dropdownElement!: HTMLDivElement

  private selectId = `select-${Math.random().toString(36).substr(2, 9)}`

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
    .select--sm .select-input,
    .select--sm .select-display {
      padding: var(--space-2) var(--space-3);
      font-size: var(--font-size-sm);
    }

    .select--sm .select-input,
    .select--sm .select-display {
      padding-right: var(--space-8);
    }

    .select--md .select-input,
    .select--md .select-display {
      padding: var(--space-3) var(--space-4);
      font-size: var(--font-size-base);
    }

    .select--md .select-input,
    .select--md .select-display {
      padding-right: var(--space-10);
    }

    .select--lg .select-input,
    .select--lg .select-display {
      padding: var(--space-4) var(--space-5);
      font-size: var(--font-size-lg);
    }

    .select--lg .select-input,
    .select--lg .select-display {
      padding-right: var(--space-12);
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
      background-color: var(--color-primary-light);
      font-weight: var(--font-weight-medium);
    }

    .dropdown-option--selected:hover,
    .dropdown-option--selected.dropdown-option--highlighted {
      background-color: var(--color-primary-light);
    }

    .dropdown-no-results {
      padding: var(--space-3);
      color: var(--color-text-secondary);
      text-align: center;
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

  private handleKeydown(event: KeyboardEvent) {
    if (this.disabled) return

    switch (event.key) {
      case 'Enter':
        event.preventDefault()
        if (this.isOpen) {
          if (this.highlightedIndex >= 0 && this.highlightedIndex < this.filteredOptions.length) {
            this.selectOption(this.filteredOptions[this.highlightedIndex])
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
          if (!this.isOpen) {
            this.toggleDropdown()
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
                >
                  ${this.filteredOptions.length === 0
                    ? html` <div class="dropdown-no-results">No options found</div> `
                    : this.filteredOptions.map(
                        (option, index) => html`
                          <div
                            class=${classMap({
                              'dropdown-option': true,
                              'dropdown-option--selected': option.value === this.value,
                              'dropdown-option--highlighted': index === this.highlightedIndex,
                            })}
                            role="option"
                            aria-selected=${option.value === this.value}
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
      </div>
    `
  }
}
