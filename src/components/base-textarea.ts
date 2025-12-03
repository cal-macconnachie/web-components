import { css, html } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { BaseElement } from '../base-element'

type TextareaSize = 'sm' | 'md' | 'lg'
type ResizeMode = 'none' | 'both' | 'horizontal' | 'vertical'

@customElement('base-textarea')
export class BaseTextarea extends BaseElement {
  @property({ type: String }) value = ''
  @property({ type: String }) label?: string
  @property({ type: String }) placeholder?: string
  @property({ type: Boolean, reflect: true }) required = false
  @property({ type: Boolean, reflect: true }) disabled = false
  @property({ type: String }) error?: string
  @property({ type: String }) hint?: string
  @property({ type: String }) size: TextareaSize = 'md'
  @property({ type: Number }) rows = 4
  @property({ type: Number }) maxlength?: number
  @property({ type: String }) resize: ResizeMode = 'vertical'

  @query('textarea') private textareaElement!: HTMLTextAreaElement

  private textareaId = `textarea-${Math.random().toString(36).substr(2, 9)}`

  static styles = css`
    :host {
      display: block;
    }

    .textarea-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .textarea-label {
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

    .textarea-wrapper {
      position: relative;
      display: flex;
      flex-direction: column;
    }

    .base-textarea {
      width: 100%;
      max-width: 100%;
      font-family: var(--font-family-sans);
      background-color: var(--color-bg-primary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      transition: all var(--transition-fast);
      color: var(--color-text-primary);
      line-height: var(--line-height-normal);
      box-sizing: border-box;
    }

    .base-textarea:hover:not(:disabled) {
      border-color: var(--color-border-hover);
    }

    .base-textarea:focus {
      outline: none;
      border-color: var(--color-border-focus);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .base-textarea::placeholder {
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
    .base-textarea:-webkit-autofill {
      -webkit-box-shadow: 0 0 0 1000px var(--color-bg-primary) inset !important;
      box-shadow: 0 0 0 1000px var(--color-bg-primary) inset !important;
      -webkit-text-fill-color: var(--color-text-primary) !important;
      background-color: var(--color-bg-primary) !important;
      border-color: var(--color-border) !important;
      transition: border-color var(--transition-fast) !important;
      animation: autofillBackground 0s forwards;
    }

    .base-textarea:-webkit-autofill:hover:not(:disabled) {
      -webkit-box-shadow: 0 0 0 1000px var(--color-bg-primary) inset !important;
      box-shadow: 0 0 0 1000px var(--color-bg-primary) inset !important;
      border-color: var(--color-border-hover) !important;
    }

    .base-textarea:-webkit-autofill:focus {
      -webkit-box-shadow: 0 0 0 1000px var(--color-bg-primary) inset !important;
      box-shadow: 0 0 0 1000px var(--color-bg-primary) inset !important;
      border-color: var(--color-border-focus) !important;
      box-shadow: 0 0 0 1000px var(--color-bg-primary) inset, 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
    }

    /* Sizes */
    .base-textarea--sm {
      padding: var(--space-2) var(--space-3);
      font-size: var(--font-size-sm);
    }

    .base-textarea--md {
      padding: var(--space-3) var(--space-4);
      font-size: var(--font-size-base);
    }

    .base-textarea--lg {
      padding: var(--space-4) var(--space-5);
      font-size: var(--font-size-lg);
    }

    /* Resize modes */
    .base-textarea--resize-none {
      resize: none;
    }

    .base-textarea--resize-both {
      resize: both;
    }

    .base-textarea--resize-horizontal {
      resize: horizontal;
    }

    .base-textarea--resize-vertical {
      resize: vertical;
    }

    /* States */
    .base-textarea--error {
      border-color: var(--color-error);
    }

    .base-textarea--error:focus {
      border-color: var(--color-error);
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }

    .base-textarea--disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background-color: var(--color-bg-muted);
    }

    .character-count {
      display: flex;
      justify-content: flex-end;
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      margin-top: var(--space-1);
    }

    .character-count--warning {
      color: var(--color-warning);
    }

    .character-count--error {
      color: var(--color-error);
    }

    .textarea-error {
      font-size: var(--font-size-sm);
      color: var(--color-error);
      line-height: var(--line-height-tight);
    }

    .textarea-hint {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      line-height: var(--line-height-tight);
    }
  `

  private handleInput(event: Event) {
    const target = event.target as HTMLTextAreaElement
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
    this.textareaElement?.focus()
  }

  render() {
    const hasError = !!this.error
    const charCount = this.value.length
    const showCharCount = this.maxlength !== undefined
    const isNearLimit = !!(this.maxlength && charCount > this.maxlength * 0.8)
    const isOverLimit = !!(this.maxlength && charCount > this.maxlength)

    const textareaClasses = {
      'base-textarea': true,
      [`base-textarea--${this.size}`]: true,
      [`base-textarea--resize-${this.resize}`]: true,
      'base-textarea--error': hasError,
      'base-textarea--disabled': this.disabled,
    }

    const charCountClasses = {
      'character-count': true,
      'character-count--warning': isNearLimit && !isOverLimit,
      'character-count--error': isOverLimit,
    }

    return html`
      <div class="textarea-group">
        ${this.label
          ? html`
              <label for=${this.textareaId} class="textarea-label">
                ${this.label}
                ${this.required
                  ? html`<span class="required-indicator" aria-label="required">*</span>`
                  : ''}
              </label>
            `
          : ''}

        <div class="textarea-wrapper">
          <textarea
            id=${this.textareaId}
            class=${classMap(textareaClasses)}
            placeholder=${ifDefined(this.placeholder)}
            rows=${this.rows}
            maxlength=${ifDefined(this.maxlength)}
            ?disabled=${this.disabled}
            ?required=${this.required}
            aria-describedby=${ifDefined(hasError ? `${this.textareaId}-error` : undefined)}
            aria-invalid=${hasError}
            .value=${this.value}
            @input=${this.handleInput}
            @blur=${this.handleBlur}
            @focus=${this.handleFocus}
          ></textarea>

          ${showCharCount
            ? html`
                <div class=${classMap(charCountClasses)}>
                  ${charCount}${this.maxlength ? ` / ${this.maxlength}` : ''}
                </div>
              `
            : ''}
        </div>

        ${hasError
          ? html`
              <div id="${this.textareaId}-error" class="textarea-error" role="alert">
                ${this.error}
              </div>
            `
          : this.hint
            ? html` <div class="textarea-hint">${this.hint}</div> `
            : ''}
      </div>
    `
  }
}
