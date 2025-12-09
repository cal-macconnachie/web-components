import { css, html, nothing } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { BaseElement } from '../base-element'
import type { TabData } from './base-tab'

type TabVariant = 'horizontal' | 'sidebar'

@customElement('base-tabs')
export class BaseTabs extends BaseElement {
  @property({ type: String, attribute: 'active-tab' }) activeTab = ''
  @property({ type: String, attribute: 'aria-label' }) ariaLabel = 'Dashboard navigation'
  @property({ type: Boolean, attribute: 'sync-with-hash' }) syncWithHash = true
  @property({ type: String }) variant: TabVariant = 'sidebar'
  @property({ type: Boolean, attribute: 'force-expanded' }) forceExpanded = false

  @state() private tabs: TabData[] = []
  @state() private isExpanded = false
  @state() private isMobile = false

  @query('.tabs-nav') private tabsNav?: HTMLElement

  private boundHashChangeHandler = this.handleHashChange.bind(this)
  private boundResizeHandler = this.handleResize.bind(this)
  private hasInitialized = false

  static styles = css`
    :host {
      display: block;
      min-width: 0;
    }

    .base-tabs {
      width: 100%;
      min-width: 0;
      overflow-x: hidden;
    }

    .base-tabs--vertical {
      display: flex;
      gap: var(--space-6, 1.5rem);
      align-items: flex-start;
      padding: var(--space-4, 1rem);
      min-width: 0;
      overflow-x: hidden;
      height: 100%;
    }

    /* Sidebar Layout */
    .tabs-sidebar {
      position: sticky;
      top: var(--space-4, 1rem);
      max-height: calc(100dvh - var(--space-8, 2rem));
      display: flex;
      flex-direction: column;
      gap: var(--space-4, 1rem);
      background: var(--color-bg-primary, #ffffff);
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-lg, 0.75rem);
      padding: var(--space-4, 1rem);
      width: 80px;
      transition: width var(--transition-base, 200ms);
      overflow-y: auto;
      overflow-x: hidden;
      scrollbar-width: thin;
      box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
    }

    .tabs-sidebar--expanded {
      width: 260px;
    }

    .sidebar-header {
      display: flex;
      flex-direction: column;
      gap: var(--space-3, 0.75rem);
      padding-bottom: var(--space-3, 0.75rem);
      border-bottom: 1px solid var(--color-border, #e2e8f0);
    }

    .sidebar-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-2, 0.5rem);
      background: none;
      border: none;
      color: var(--color-text-secondary, #64748b);
      cursor: pointer;
      border-radius: var(--radius-md, 0.5rem);
      transition: all var(--transition-fast, 150ms);
    }

    .sidebar-toggle--hidden {
      display: none;
    }

    .sidebar-toggle:hover {
      background: var(--color-bg-muted, #f8fafc);
      color: var(--color-text-primary, #0f172a);
    }

    .sidebar-toggle svg {
      stroke: var(--color-text-primary, #0f172a);
      opacity: 0.8;
    }

    .sidebar-toggle:hover svg {
      stroke: var(--color-text-primary, #0f172a);
      opacity: 1;
    }

    .sidebar-toggle:focus-visible {
      outline: 2px solid var(--color-primary, #2563eb);
      outline-offset: 2px;
    }

    .tabs-nav {
      display: flex;
      flex-direction: column;
      gap: var(--space-2, 0.5rem);
      flex: 1;
    }

    .sidebar-footer {
      display: flex;
      flex-direction: column;
      gap: var(--space-2, 0.5rem);
      padding-top: var(--space-3, 0.75rem);
      border-top: 1px solid var(--color-border, #e2e8f0);
      margin-top: auto;
    }

    .tabs-sidebar .tab-button {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: var(--space-3, 0.75rem);
      padding: var(--space-3, 0.75rem);
      background: none;
      border: none;
      border-radius: var(--radius-md, 0.5rem);
      color: var(--color-text-secondary, #64748b);
      font-size: var(--font-size-base, 1rem);
      font-weight: var(--font-weight-medium, 500);
      cursor: pointer;
      white-space: nowrap;
      transition: color var(--transition-fast, 150ms),
                  background var(--transition-fast, 150ms);
      text-align: left;
      width: 100%;
      min-height: 44px;
    }

    .tabs-sidebar .tab-button:hover {
      color: var(--color-text-primary, #0f172a);
      background: var(--color-bg-muted, #f8fafc);
    }

    .tabs-sidebar .tab-button:focus-visible {
      outline: 2px solid var(--color-primary, #2563eb);
      outline-offset: -2px;
    }

    .tabs-sidebar .tab-button--active {
      color: var(--color-primary, #2563eb);
      background: var(--color-primary-light, rgba(59, 130, 246, 0.1));
    }

    .tab-icon {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 18px;
    }

    .tab-icon svg {
      width: 20px;
      height: 20px;
      stroke: currentColor;
    }

    .tabs-sidebar .tab-label {
      flex: 1;
      line-height: 1;
      overflow: visible;
      text-overflow: ellipsis;
    }

    .tabs-sidebar .tab-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 var(--space-1, 0.25rem);
      background: var(--color-error, #dc2626);
      color: white;
      border-radius: var(--radius-full, 9999px);
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: var(--font-weight-semibold, 600);
      line-height: 1;
      flex-shrink: 0;
    }

    .tabs-sidebar .tab-button--active .tab-badge {
      background: var(--color-primary, #2563eb);
    }

    /* Horizontal Layout */
    .tabs-header {
      display: flex;
      gap: var(--space-2, 0.5rem);
      border-bottom: 2px solid var(--color-border, #e2e8f0);
      margin-bottom: var(--space-6, 1.5rem);
      overflow-x: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .tabs-header::-webkit-scrollbar {
      display: none;
    }

    .tabs-header .tab-button {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-1, 0.25rem);
      padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      color: var(--color-text-secondary, #64748b);
      font-size: var(--font-size-base, 1rem);
      font-weight: var(--font-weight-medium, 500);
      cursor: pointer;
      white-space: nowrap;
      transition: all var(--transition-fast, 150ms);
    }

    .tabs-header .tab-button:hover {
      color: var(--color-text-primary, #0f172a);
      background: var(--color-bg-muted, #f8fafc);
    }

    .tabs-header .tab-button:focus-visible {
      outline: 2px solid var(--color-primary, #2563eb);
      outline-offset: -2px;
      border-radius: var(--radius-sm, 0.25rem);
    }

    .tabs-header .tab-button--active {
      color: var(--color-primary, #2563eb);
      border-bottom-color: var(--color-primary, #2563eb);
    }

    .tabs-header .tab-icon {
      flex-shrink: 0;
      width: 100%;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 0;
    }

    .tabs-header .tab-icon svg {
      width: 20px;
      height: 20px;
      stroke: currentColor;
      display: block;
      margin: 0 auto;
    }

    .tabs-header .tab-label {
      width: 100%;
      line-height: 1;
      text-align: center;
    }

    .tabs-header .tab-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 var(--space-1, 0.25rem);
      background: var(--color-error, #dc2626);
      color: white;
      border-radius: var(--radius-full, 9999px);
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: var(--font-weight-semibold, 600);
      line-height: 1;
    }

    .tabs-header .tab-button--active .tab-badge {
      background: var(--color-primary, #2563eb);
    }

    .tabs-content {
      flex: 1;
      min-width: 0;
      animation: fadeIn 0.2s ease-in;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .base-tabs--vertical .tabs-content {
      flex: 1;
      min-width: 0;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      :host {
        overflow-x: hidden;
      }

      .base-tabs {
        overflow-x: hidden;
      }

      .base-tabs--vertical {
        flex-direction: column;
        padding: 0;
        overflow-x: hidden;
      }

      .tabs-sidebar {
        position: relative;
        width: 100%;
        max-height: none;
        border-radius: var(--radius-lg);
        border-left: 1px solid var(--color-border, #e2e8f0);
        border-right: 1px solid var(--color-border, #e2e8f0);
        padding: var(--space-3);
        padding-left: 0;
        padding-right: 0;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        z-index: 10;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        grid-template-rows: auto auto;
        gap: var(--space-3, 0.75rem);
        align-items: center;
        box-sizing: border-box;
      }

      .tabs-sidebar--expanded {
        width: 100%;
      }

      .sidebar-toggle {
        display: none;
      }

      .sidebar-header {
        grid-column: 1;
        grid-row: 1;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
        gap: 0;
        padding-bottom: 0;
        border-bottom: none;
      }

      .sidebar-header .sidebar-profile {
        display: none;
      }

      .sidebar-footer {
        grid-column: 2;
        grid-row: 1;
        flex-direction: row;
        justify-content: flex-end;
        align-items: center;
        padding-top: 0;
        border-top: none;
        margin-top: 0;
        margin-left: auto;
      }

      .tabs-nav {
        grid-column: 1 / -1;
        grid-row: 2;
        flex-direction: row;
        gap: var(--space-1, 0.25rem);
        overflow-x: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
        padding: 0;
        min-width: 0;
      }

      .tabs-nav::-webkit-scrollbar {
        display: none;
      }

      .tabs-sidebar .tab-button {
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: var(--space-1, 0.25rem);
        padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
        min-width: 70px;
        width: auto;
        min-height: auto;
        position: relative;
        flex-shrink: 0;
        margin-left: var(--space-2);
        margin-right: var(--space-2);
        margin-bottom: var(--space-2);
      }

      .tabs-sidebar .tab-button .tab-label {
        display: block;
        font-size: 11px;
        text-align: center;
        line-height: 1.2;
      }

      .tabs-sidebar .tab-icon {
        width: 20px;
        height: 20px;
        margin-left: 0;
      }

      .tabs-sidebar .tab-badge {
        position: absolute;
        top: 4px;
        right: 4px;
        min-width: 16px;
        height: 16px;
        font-size: 10px;
      }

      .base-tabs--vertical .tabs-content {
        width: 100%;
        padding: var(--space-4, 1rem) var(--space-3, 0.75rem);
        box-sizing: border-box;
      }
    }

    @media (max-width: 640px) {
      .tabs-header {
        gap: var(--space-1, 0.25rem);
        margin-bottom: var(--space-4, 1rem);
      }

      .tabs-header .tab-button {
        padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
        font-size: var(--font-size-sm, 0.875rem);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      * {
        animation: none !important;
        transition: none !important;
      }
    }
  `

  connectedCallback() {
    super.connectedCallback()
    window.addEventListener('hashchange', this.boundHashChangeHandler)
    window.addEventListener('resize', this.boundResizeHandler)
    this.handleResize() // Initial check

    // Listen for tab registration from child base-tab elements
    this.addEventListener('tab-register', this.handleTabRegister as EventListener)
    this.addEventListener('tab-badge-update', this.handleTabBadgeUpdate as EventListener)
  }

  disconnectedCallback() {
    window.removeEventListener('hashchange', this.boundHashChangeHandler)
    window.removeEventListener('resize', this.boundResizeHandler)
    this.removeEventListener('tab-register', this.handleTabRegister as EventListener)
    this.removeEventListener('tab-badge-update', this.handleTabBadgeUpdate as EventListener)
    super.disconnectedCallback()
  }

  firstUpdated() {
    // Query and register child tabs directly
    this.queryAndRegisterTabs()
  }

  private queryAndRegisterTabs() {
    const tabElements = this.querySelectorAll('base-tab')
    const newTabs: TabData[] = []

    tabElements.forEach((tabEl) => {
      const tabData: TabData = {
        id: tabEl.id,
        label: tabEl.getAttribute('label') || '',
        badge: tabEl.hasAttribute('badge') ? Number(tabEl.getAttribute('badge')) : undefined,
        icon: tabEl.getAttribute('icon') || undefined,
      }

      if (tabData.id && !this.tabs.find(t => t.id === tabData.id)) {
        newTabs.push(tabData)
      }
    })

    // Batch all new tabs into a single update
    if (newTabs.length > 0) {
      this.tabs = [...this.tabs, ...newTabs]
    }
  }

  willUpdate(changedProperties: Map<string, unknown>) {
    super.willUpdate(changedProperties)

    // Initialize active tab when tabs become available
    if (changedProperties.has('tabs') && this.tabs.length > 0 && !this.activeTab && !this.hasInitialized) {
      this.hasInitialized = true

      if (this.syncWithHash && window.location.hash) {
        const hashTabId = window.location.hash.replace('#', '')
        const matchingTab = this.tabs.find(t => t.id === hashTabId)
        if (matchingTab) {
          this.activeTab = hashTabId
        } else {
          this.activeTab = this.tabs[0].id
        }
      } else {
        this.activeTab = this.tabs[0].id
      }

      // Update hash if needed
      if (this.syncWithHash && this.activeTab) {
        history.replaceState(null, '', `#${this.activeTab}`)
      }
    }
  }

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties)

    // When activeTab changes, update child base-tab elements
    if (changedProperties.has('activeTab')) {
      this.updateChildTabs()
    }
  }

  private handleTabRegister(event: CustomEvent<TabData>) {
    event.stopPropagation()
    const tabData = event.detail

    // Only register if not already registered
    if (!this.tabs.find(t => t.id === tabData.id)) {
      this.tabs = [...this.tabs, tabData]
    }
  }

  private handleTabBadgeUpdate(event: CustomEvent<{ id: string; badge?: number }>) {
    event.stopPropagation()
    const { id, badge } = event.detail

    const tabIndex = this.tabs.findIndex(t => t.id === id)
    if (tabIndex !== -1) {
      this.tabs = this.tabs.map((tab, index) =>
        index === tabIndex ? { ...tab, badge } : tab
      )
    }
  }

  private updateChildTabs() {
    const tabElements = this.querySelectorAll('base-tab')
    tabElements.forEach((tab) => {
      tab.active = tab.id === this.activeTab
    })
  }

  private handleHashChange() {
    if (!this.syncWithHash) return

    const hashTabId = window.location.hash.replace('#', '')
    const matchingTab = this.tabs.find(t => t.id === hashTabId)

    if (matchingTab && hashTabId !== this.activeTab) {
      this.selectTab(hashTabId)
    }
  }

  private handleResize() {
    this.isMobile = window.innerWidth <= 768
  }

  private selectTab(id: string) {
    this.activeTab = id

    // Update URL hash without scrolling
    if (this.syncWithHash) {
      history.replaceState(null, '', `#${id}`)
    }

    // Dispatch change event
    this.dispatchEvent(
      new CustomEvent('tab-change', {
        detail: { activeTab: id },
        bubbles: true,
        composed: true,
      })
    )
  }

  private handleTabClick(id: string) {
    this.selectTab(id)
  }

  private handleKeyDown(event: KeyboardEvent, currentIndex: number) {
    let nextIndex = currentIndex

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault()
        nextIndex = currentIndex + 1
        if (nextIndex >= this.tabs.length) {
          nextIndex = 0
        }
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault()
        nextIndex = currentIndex - 1
        if (nextIndex < 0) {
          nextIndex = this.tabs.length - 1
        }
        break
      case 'Home':
        event.preventDefault()
        nextIndex = 0
        break
      case 'End':
        event.preventDefault()
        nextIndex = this.tabs.length - 1
        break
      default:
        return
    }

    const nextTab = this.tabs[nextIndex]
    if (nextTab) {
      this.selectTab(nextTab.id)
      // Focus the next tab button
      const nextButton = this.shadowRoot?.querySelector(`#tab-${nextTab.id}`) as HTMLButtonElement
      nextButton?.focus()
    }
  }

  private toggleSidebar() {
    this.isExpanded = !this.isExpanded
  }

  private renderTabButton(tab: TabData, index: number) {
    const isActive = this.activeTab === tab.id
    const isExpanded = this.forceExpanded || this.isExpanded
    const classes = {
      'tab-button': true,
      'tab-button--active': isActive,
    }

    return html`
      <button
        role="tab"
        aria-selected=${isActive}
        aria-controls="tabpanel-${tab.id}"
        id="tab-${tab.id}"
        tabindex=${isActive ? 0 : -1}
        class=${classMap(classes)}
        @click=${() => this.handleTabClick(tab.id)}
        @keydown=${(e: KeyboardEvent) => this.handleKeyDown(e, index)}
      >
        ${tab.icon
          ? html`<span class="tab-icon">${unsafeHTML(tab.icon)}</span>`
          : nothing}
        ${isExpanded || this.variant !== 'sidebar' || this.isMobile
          ? html`<span class="tab-label">${tab.label}</span>`
          : nothing}
        ${tab.badge !== undefined && tab.badge > 0 && (isExpanded || this.variant !== 'sidebar' || this.isMobile)
          ? html`<span class="tab-badge">${tab.badge}</span>`
          : nothing}
      </button>
    `
  }

  render() {
    const containerClasses = {
      'base-tabs': true,
      'base-tabs--vertical': this.variant === 'sidebar',
    }

    const isExpanded = this.forceExpanded || this.isExpanded

    const sidebarClasses = {
      'tabs-sidebar': true,
      'tabs-sidebar--expanded': isExpanded,
    }

    const toggleClasses = {
      'sidebar-toggle': true,
      'sidebar-toggle--hidden': this.forceExpanded,
    }

    return html`
      <div class=${classMap(containerClasses)} role="tablist" aria-label=${this.ariaLabel}>
        ${this.variant === 'sidebar'
          ? html`
              <div class=${classMap(sidebarClasses)}>
                <!-- Sidebar Header -->
                <div class="sidebar-header">
                  <slot name="sidebar-header"></slot>
                </div>

                <!-- Sidebar Toggle -->
                <button
                  class=${classMap(toggleClasses)}
                  @click=${this.toggleSidebar}
                  aria-label="Toggle sidebar"
                >
                  ${
                    isExpanded ? html`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 19l-7-7 7-7" />
        </svg>` : html`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 5l7 7-7 7" />
        </svg>`
                  }
                </button>

                <!-- Tabs Navigation -->
                <nav class="tabs-nav">
                  ${this.tabs.map((tab, index) => this.renderTabButton(tab, index))}
                </nav>

                <!-- Sidebar Footer -->
                <div class="sidebar-footer">
                  <slot name="sidebar-footer"></slot>
                </div>
              </div>
            `
          : html`
              <div class="tabs-header">
                ${this.tabs.map((tab, index) => this.renderTabButton(tab, index))}
              </div>
            `}

        <!-- Tabs Content -->
        <div class="tabs-content">
          <slot></slot>
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'base-tabs': BaseTabs
  }
}
