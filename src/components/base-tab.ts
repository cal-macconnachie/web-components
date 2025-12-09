import { css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { BaseElement } from '../base-element'

export interface TabData {
  id: string
  label: string
  badge?: number
  icon?: string
}

@customElement('base-tab')
export class BaseTab extends BaseElement {
  @property({ type: String, reflect: true }) id = ''
  @property({ type: String }) label = ''
  @property({ type: Number }) badge?: number
  @property({ type: String }) icon?: string
  @property({ type: Boolean, reflect: true }) active = false

  static styles = css`
    :host {
      display: none;
      scroll-margin-top: 2rem;
    }

    :host([active]) {
      display: block;
    }

    .base-tab {
      width: 100%;
    }
  `

  connectedCallback() {
    super.connectedCallback()
    // Notify parent tabs component that this tab is registered
    this.dispatchEvent(
      new CustomEvent('tab-register', {
        detail: {
          id: this.id,
          label: this.label,
          badge: this.badge,
          icon: this.icon,
        } as TabData,
        bubbles: true,
        composed: true,
      })
    )
  }

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties)

    // Notify parent of badge changes
    if (changedProperties.has('badge')) {
      this.dispatchEvent(
        new CustomEvent('tab-badge-update', {
          detail: {
            id: this.id,
            badge: this.badge,
          },
          bubbles: true,
          composed: true,
        })
      )
    }
  }

  render() {
    return html`
      <div
        class="base-tab"
        id="tabpanel-${this.id}"
        role="tabpanel"
        aria-labelledby="tab-${this.id}"
      >
        <slot></slot>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'base-tab': BaseTab
  }
}
