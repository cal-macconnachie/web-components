import { css, html } from 'lit'
import { property, state } from 'lit/decorators.js'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { BaseElement } from '../base-element'
import { register } from '../helpers/register'

// Import all SVGs as raw strings at build time
const icons = import.meta.glob('../../public/icons/*.svg', {
  as: 'raw',
  eager: true
});

export const registerBaseIcon = () => register({
  name: 'base-icon',
  element: BaseIcon
});

export class BaseIcon extends BaseElement {
  @property({ type: String }) name = '';
  @property({ type: String }) size = '24px';
  @property({ type: String }) color = 'currentColor';

  @state() private svgContent = '';

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    svg {
      width: var(--icon-size, 24px);
      height: var(--icon-size, 24px);
      fill: var(--icon-color, currentColor);
    }

    /* Remove any embedded styles from SVGs */
    svg style,
    svg .cls-1,
    svg .cls-2,
    svg .cls-3 {
      fill: inherit;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadIcon();
  }

  updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);
    if (changedProperties.has('name')) {
      this.loadIcon();
    }
  }

  private loadIcon() {
    if (!this.name) {
      this.svgContent = '';
      return;
    }

    try {
      // Look up the icon from the pre-loaded registry
      const iconPath = `../../public/icons/${this.name}.svg`;
      let svg = icons[iconPath];

      if (!svg) {
        throw new Error(`Icon "${this.name}" not found`);
      }

      // Remove the <?xml> declaration
      svg = svg.replace(/<\?xml[^?]*\?>/g, '');

      // Remove <style> tags and their content
      svg = svg.replace(/<style[\s\S]*?<\/style>/gi, '');

      // Remove inline style attributes
      svg = svg.replace(/\s+style="[^"]*"/gi, '');

      // Remove <defs> tags if they only contained styles
      svg = svg.replace(/<defs>\s*<\/defs>/gi, '');

      // Remove fill attributes to allow CSS control
      svg = svg.replace(/\s+fill="[^"]*"/gi, '');

      // Clean up whitespace
      svg = svg.trim();

      this.svgContent = svg;
    } catch (error) {
      console.error(`Error loading icon "${this.name}":`, error);
      this.svgContent = '';
    }
  }

  render() {
    return html`
      <div
        style="
          --icon-size: ${this.size};
        "
      >
        ${unsafeHTML(this.svgContent)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'base-icon': BaseIcon;
  }
}
