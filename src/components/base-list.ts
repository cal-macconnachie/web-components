import { css, html } from 'lit'
import { property } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { BaseElement } from '../base-element'
import { register } from '../helpers/register'

type ListSize = 'sm' | 'md' | 'lg'
type ListVariant = 'default' | 'bordered' | 'divided'

export const registerBaseList = () => register({
  name: 'base-list',
  element: BaseList
})

export class BaseList extends BaseElement {
  @property({ type: String, attribute: 'size' }) size: ListSize = 'md'
  @property({ type: String, attribute: 'variant' }) variant: ListVariant = 'default'
  @property({ type: Boolean, reflect: true, attribute: 'interactive' }) interactive = false
  @property({ type: String, attribute: 'role' }) role: string = 'list'

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .base-list {
      display: flex;
      flex-direction: column;
      width: 100%;
      background-color: inherit;
    }

    /* Variants */
    .base-list--default {
      gap: 0;
    }

    .base-list--bordered {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      gap: 0;
    }

    .base-list--divided {
      gap: 0;
    }

    .base-list--divided ::slotted(base-list-item:not(:last-child)) {
      border-bottom: 1px solid var(--color-border);
    }

    /* Size variants - affects spacing between items for default variant only */
    .base-list--sm.base-list--default {
      gap: var(--space-1);
    }

    .base-list--md.base-list--default {
      gap: var(--space-2);
    }

    .base-list--lg.base-list--default {
      gap: var(--space-3);
    }

    /* Interactive lists */
    .base-list--interactive ::slotted(base-list-item) {
      cursor: pointer;
      transition: background-color var(--transition-fast);
    }

    .base-list--interactive ::slotted(base-list-item:hover) {
      background-color: var(--color-bg-muted);
    }

    .base-list--interactive ::slotted(base-list-item:focus-visible) {
      outline: 2px solid var(--color-border-focus);
      outline-offset: -2px;
    }
  `

  render() {
    const classes = {
      'base-list': true,
      [`base-list--${this.size}`]: true,
      [`base-list--${this.variant}`]: true,
      'base-list--interactive': this.interactive,
    }

    return html`
      <div class=${classMap(classes)} role=${this.role}>
        <slot></slot>
      </div>
    `
  }
}
