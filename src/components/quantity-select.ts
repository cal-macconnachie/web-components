import { css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { BaseElement } from '../base-element'

type QuantitySize = 'xs' | 'sm' | 'md' | 'lg'

@customElement('quantity-select')
export class QuantitySelect extends BaseElement {
  @property({ type: Number }) value = 0
  @property({ type: Number }) min = 0
  @property({ type: Number }) max = 99
  @property({ type: String }) size: QuantitySize = 'md'
  @property({ type: Boolean, attribute: 'allow-input' }) allowInput = true

  static styles = css`
    :host {
      display: inline-block;
    }

    .quantity-input-wrapper {
      display: flex;
      align-items: center;
      gap: 0;
      width: fit-content;
      opacity: 1;
      visibility: visible;
      transition:
        opacity 0.2s ease,
        visibility 0.2s ease;
    }

    .quantity-input-wrapper--hidden {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }

    .quantity-btn {
      border: 2px solid var(--color-border);
      background: var(--color-bg-primary);
      color: var(--color-text-primary);
      cursor: pointer;
      font-weight: var(--font-weight-bold);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      user-select: none;
      font-family: var(--font-family-sans);
      box-sizing: border-box;
    }

    .quantity-btn:hover:not(:disabled) {
      background: var(--color-bg-secondary);
      border-color: var(--color-border-hover);
    }

    .quantity-btn:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .quantity-btn--minus {
      border-radius: var(--radius-md) 0 0 var(--radius-md);
      border-right: none;
    }

    .quantity-btn--plus {
      border-radius: 0 var(--radius-md) var(--radius-md) 0;
      border-left: none;
    }

    .quantity-input {
      border: 2px solid var(--color-border);
      border-left: none;
      border-right: none;
      background: var(--color-bg-primary);
      color: var(--color-text-primary);
      text-align: center;
      font-weight: var(--font-weight-medium);
      outline: none;
      font-family: var(--font-family-sans);
      transition: border-color 0.2s ease;
      box-sizing: border-box;
    }

    .quantity-input:focus {
      outline: none;
    }

    .quantity-input:disabled {
      cursor: not-allowed;
      opacity: 0.7;
    }

    .quantity-input:read-only {
      cursor: default;
      background: var(--color-bg-muted);
    }

    .quantity-input::-webkit-outer-spin-button,
    .quantity-input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .quantity-input[type='number'] {
      -moz-appearance: textfield;
      appearance: textfield;
    }

    /* Size variants */
    .quantity-btn--xs {
      width: 24px;
      height: 24px;
      font-size: var(--font-size-sm);
    }

    .quantity-input--xs {
      width: 32px;
      height: 24px;
      font-size: calc(var(--font-size-sm) * 3 / 4);
    }

    .quantity-btn--sm {
      width: 32px;
      height: 32px;
      font-size: var(--font-size-base);
    }

    .quantity-input--sm {
      width: 48px;
      height: 32px;
      font-size: var(--font-size-sm);
    }

    .quantity-btn--md {
      width: 40px;
      height: 40px;
      font-size: var(--font-size-lg);
    }

    .quantity-input--md {
      width: 60px;
      height: 40px;
      font-size: var(--font-size-base);
    }

    .quantity-btn--lg {
      width: 48px;
      height: 48px;
      font-size: var(--font-size-xl);
    }

    .quantity-input--lg {
      width: 72px;
      height: 48px;
      font-size: var(--font-size-lg);
    }
  `

  private clampValue(value: number): number {
    return Math.max(this.min, Math.min(this.max, value))
  }

  private updateValue(newValue: number) {
    const clampedValue = this.clampValue(newValue)
    const oldValue = this.value

    if (clampedValue !== oldValue) {
      this.value = clampedValue

      this.dispatchEvent(
        new CustomEvent('change', {
          detail: { value: this.value, oldValue },
          bubbles: true,
          composed: true,
        })
      )
    }
  }

  private handleDecrement() {
    this.updateValue(this.value - 1)
  }

  private handleIncrement() {
    this.updateValue(this.value + 1)
  }

  private handleInput(event: Event) {
    const target = event.target as HTMLInputElement
    const newValue = parseInt(target.value, 10)

    if (!isNaN(newValue)) {
      this.updateValue(newValue)
    } else {
      // Reset to current value if invalid
      target.value = String(this.value)
    }
  }

  private handleKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      this.handleIncrement()
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      this.handleDecrement()
    }
  }

  render() {
    const wrapperClasses = {
      'quantity-input-wrapper': true,
      [`quantity-input-wrapper--${this.size}`]: true,
    }

    const btnClasses = (type: 'minus' | 'plus') => ({
      'quantity-btn': true,
      [`quantity-btn--${type}`]: true,
      [`quantity-btn--${this.size}`]: true,
    })

    const inputClasses = {
      'quantity-input': true,
      [`quantity-input--${this.size}`]: true,
    }

    return html`
      <div class=${classMap(wrapperClasses)}>
        <button
          type="button"
          @click=${this.handleDecrement}
          ?disabled=${this.value <= this.min}
          class=${classMap(btnClasses('minus'))}
          aria-label="Decrease quantity"
        >
          −
        </button>
        <input
          id="quantity"
          .value=${String(this.value)}
          ?readonly=${!this.allowInput}
          type="number"
          min=${this.min}
          max=${this.max}
          class=${classMap(inputClasses)}
          @input=${this.handleInput}
          @keydown=${this.handleKeydown}
          aria-label="Quantity"
        />
        <button
          type="button"
          @click=${this.handleIncrement}
          ?disabled=${this.value >= this.max}
          class=${classMap(btnClasses('plus'))}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
    `
  }
}
