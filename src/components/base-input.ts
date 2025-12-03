import { css, html } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { BaseElement } from '../base-element'

type InputType = 'text' | 'email' | 'password' | 'tel' | 'url'
type InputSize = 'sm' | 'md' | 'lg'

@customElement('base-input')
export class BaseInput extends BaseElement {
  @property({ type: String }) value = ''
  @property({ type: String }) label?: string
  @property({ type: String }) placeholder?: string
  @property({ type: String }) type: InputType = 'text'
  @property({ type: Boolean, reflect: true }) required = false
  @property({ type: Boolean, reflect: true }) disabled = false
  @property({ type: String }) error?: string
  @property({ type: String }) hint?: string
  @property({ type: String }) autocomplete?: string
  @property({ type: String }) size: InputSize = 'md'

  @query('input') private inputElement!: HTMLInputElement

  private inputId = `input-${Math.random().toString(36).substr(2, 9)}`

  static styles = css`
    :host {
      display: block;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .input-label {
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

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .base-input {
      width: 100%;
      font-family: var(--font-family-sans);
      background-color: var(--color-bg-primary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      transition: all var(--transition-fast);
      color: var(--color-text-primary);
    }

    .base-input:hover:not(:disabled) {
      border-color: var(--color-border-hover);
    }

    .base-input:focus {
      outline: none;
      border-color: var(--color-border-focus);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .base-input::placeholder {
      color: var(--color-text-muted);
    }

    /* Autofill animation to prevent flash */
    @keyframes autofillBackground {
      to {
        background-color: var(--color-bg-primary);
        color: var(--color-text-primary);
      }
    }

    /* Autofill styles - completely override browser defaults */
    .base-input:-webkit-autofill {
      -webkit-box-shadow: 0 0 0 1000px var(--color-bg-primary) inset !important;
      box-shadow: 0 0 0 1000px var(--color-bg-primary) inset !important;
      -webkit-text-fill-color: var(--color-text-primary) !important;
      background-color: var(--color-bg-primary) !important;
      border-color: var(--color-border) !important;
      transition: border-color var(--transition-fast) !important;
      animation: autofillBackground 0s forwards;
    }

    .base-input:-webkit-autofill:hover:not(:disabled) {
      -webkit-box-shadow: 0 0 0 1000px var(--color-bg-primary) inset !important;
      box-shadow: 0 0 0 1000px var(--color-bg-primary) inset !important;
      border-color: var(--color-border-hover) !important;
    }

    .base-input:-webkit-autofill:focus {
      -webkit-box-shadow: 0 0 0 1000px var(--color-bg-primary) inset !important;
      box-shadow: 0 0 0 1000px var(--color-bg-primary) inset !important;
      border-color: var(--color-border-focus) !important;
      box-shadow: 0 0 0 1000px var(--color-bg-primary) inset, 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
    }

    /* Sizes */
    .base-input--sm {
      padding: var(--space-2) var(--space-3);
      font-size: var(--font-size-sm);
    }

    .base-input--md {
      padding: var(--space-3) var(--space-4);
      font-size: var(--font-size-base);
    }

    .base-input--lg {
      padding: var(--space-4) var(--space-5);
      font-size: var(--font-size-lg);
    }

    /* States */
    .base-input--error {
      border-color: var(--color-error);
    }

    .base-input--error:focus {
      border-color: var(--color-error);
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }

    .base-input--disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background-color: var(--color-bg-muted);
    }

    .input-suffix {
      position: absolute;
      right: var(--space-3);
      display: flex;
      align-items: center;
      color: var(--color-text-muted);
    }

    .input-error {
      font-size: var(--font-size-sm);
      color: var(--color-error);
      line-height: var(--line-height-tight);
    }

    .input-hint {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      line-height: var(--line-height-tight);
    }
  `

  private handleInput(event: Event) {
    const target = event.target as HTMLInputElement
    this.value = target.value
    this.dispatchEvent(
      new CustomEvent('input', {
        detail: { value: target.value },
        bubbles: true,
        composed: true,
      })
    )
  }

  private handleFocus() {
    this.dispatchEvent(
      new CustomEvent('focus', {
        bubbles: true,
        composed: true,
      })
    )
  }

  private handleBlur() {
    this.dispatchEvent(
      new CustomEvent('blur', {
        bubbles: true,
        composed: true,
      })
    )
  }

  focus() {
    this.inputElement?.focus()
  }

  render() {
    const hasError = !!this.error
    const inputClasses = {
      'base-input': true,
      [`base-input--${this.size}`]: true,
      'base-input--error': hasError,
      'base-input--disabled': this.disabled,
    }

    return html`
      <div class="input-group">
        ${this.label
          ? html`
              <label for=${this.inputId} class="input-label">
                ${this.label}
                ${this.required
                  ? html`<span class="required-indicator" aria-label="required">*</span>`
                  : ''}
              </label>
            `
          : ''}

        <div class="input-wrapper">
          <input
            id=${this.inputId}
            class=${classMap(inputClasses)}
            type=${this.type}
            placeholder=${ifDefined(this.placeholder)}
            ?disabled=${this.disabled}
            ?required=${this.required}
            autocomplete=${ifDefined(this.autocomplete)}
            aria-describedby=${ifDefined(hasError ? `${this.inputId}-error` : undefined)}
            aria-invalid=${hasError}
            .value=${this.value}
            @input=${this.handleInput}
            @blur=${this.handleBlur}
            @focus=${this.handleFocus}
          />

          <div class="input-suffix">
            <slot name="suffix"></slot>
          </div>
        </div>

        ${hasError
          ? html`
              <div id="${this.inputId}-error" class="input-error" role="alert">
                ${this.error}
              </div>
            `
          : this.hint
            ? html` <div class="input-hint">${this.hint}</div> `
            : ''}
      </div>
    `
  }
}
