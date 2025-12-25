import { registerAll } from '../src'

registerAll()

await customElements.whenDefined('auth-form')
await customElements.whenDefined('base-drawer')
await customElements.whenDefined('base-button')
await customElements.whenDefined('base-toast')


const toastExampleButton = document.getElementById('show-toast')
const primaryToastExampleButton = document.getElementById('show-primary-toast')
const successToastExampleButton = document.getElementById('show-success-toast')
const warningToastExampleButton = document.getElementById('show-warning-toast')
const dangerToastExampleButton = document.getElementById('show-danger-toast')
const infoToastExampleButton = document.getElementById('show-info-toast')
document.getElementById('show-top-left-toast')?.addEventListener('click', () => {
  const toastElement = document.getElementById('top-left-toast') as any
  toastElement.setAttribute('position', 'top-left')
  toastElement?.show()
})
document.getElementById('show-top-center-toast')?.addEventListener('click', () => {
  const toastElement = document.getElementById('top-center-toast') as any
  toastElement.setAttribute('position', 'top-center')
  toastElement?.show()
})
document.getElementById('show-top-right-toast')?.addEventListener('click', () => {
  const toastElement = document.getElementById('top-right-toast') as any
  toastElement.setAttribute('position', 'top-right')
  toastElement?.show()
})
document.getElementById('show-bottom-left-toast')?.addEventListener('click', () => {
  const toastElement = document.getElementById('bottom-left-toast') as any
  toastElement.setAttribute('position', 'bottom-left')
  toastElement?.show()
})
document.getElementById('show-bottom-center-toast')?.addEventListener('click', () => {
  const toastElement = document.getElementById('bottom-center-toast') as any
  toastElement.setAttribute('position', 'bottom-center')
  toastElement?.show()
})
document.getElementById('show-bottom-right-toast')?.addEventListener('click', () => {
  const toastElement = document.getElementById('bottom-right-toast') as any
  toastElement.setAttribute('position', 'bottom-right')
  toastElement?.show()
})
toastExampleButton?.addEventListener('click', () => {
  const toastElement = document.getElementById('demo-toast') as any
  toastElement?.show()
})
primaryToastExampleButton?.addEventListener('click', () => {
  const toastElement = document.getElementById('primary-toast') as any
  toastElement?.show()
})
successToastExampleButton?.addEventListener('click', () => {
  const toastElement = document.getElementById('success-toast') as any
  toastElement?.show()
})
warningToastExampleButton?.addEventListener('click', () => {
  const toastElement = document.getElementById('warning-toast') as any
  toastElement?.show()
})
dangerToastExampleButton?.addEventListener('click', () => {
  const toastElement = document.getElementById('danger-toast') as any
  toastElement?.show()
})
infoToastExampleButton?.addEventListener('click', () => {
  const toastElement = document.getElementById('info-toast') as any
  toastElement?.show()
})
document.getElementById('show-500ms-toast')?.addEventListener('click', () => {
  const toastElement = document.getElementById('500ms-toast') as any
  toastElement?.show()
})
document.getElementById('show-2s-toast')?.addEventListener('click', () => {
  const toastElement = document.getElementById('2s-toast') as any
  toastElement?.show()
})
document.getElementById('show-10s-toast')?.addEventListener('click', () => {
  const toastElement = document.getElementById('10s-toast') as any
  toastElement?.show()
})
document.getElementById('show-manual-toast')?.addEventListener('click', () => {
  const toastElement = document.getElementById('manual-toast') as any
  toastElement?.show()
})

const authFormElement = document.querySelector('auth-form')
const authDrawerElement = document.querySelector('base-drawer')

if (!authFormElement) {
  throw new Error('auth-form element not found in the document')
}

if (!authDrawerElement) {
  throw new Error('base-drawer element not found in the document')
}

const refreshButton = document.getElementById('refresh-button')
const openDrawerButton = document.querySelector('.open-drawer')
const logoutButton = document.getElementById('logout-button')

// Listen for auth success to close the drawer
authFormElement.addEventListener('auth-success', () => {
  authDrawerElement.closeDrawer()
})

// Listen for drawer close event
authDrawerElement.addEventListener('drawer-close', () => {
})

refreshButton?.addEventListener('click', async () => {
  try {
    await authFormElement.refresh()
  } catch (error) {
    console.error('Error refreshing tokens', error)
  }
})

openDrawerButton?.addEventListener('click', () => {
  authDrawerElement.openDrawer()
})

logoutButton?.addEventListener('click', async () => {
  try {
    await authFormElement.logout()
  } catch (error) {
    console.error('Error logging out', error)
  }
})

// Listen for auth refresh failures and open the drawer
window.addEventListener('auth-refresh-failed', () => {
  authDrawerElement.openDrawer()
})

// Drawer showcase examples
const drawerSm = document.getElementById('drawer-sm')
const drawerMd = document.getElementById('drawer-md')
const drawerLg = document.getElementById('drawer-lg')
const drawerForm = document.getElementById('drawer-form')

// Open drawer buttons
document.querySelector('.open-drawer-sm')?.addEventListener('click', () => {
  ;(drawerSm as any)?.openDrawer()
})

document.querySelector('.open-drawer-md')?.addEventListener('click', () => {
  ;(drawerMd as any)?.openDrawer()
})

document.querySelector('.open-drawer-lg')?.addEventListener('click', () => {
  ;(drawerLg as any)?.openDrawer()
})

document.querySelector('.open-drawer-form')?.addEventListener('click', () => {
  ;(drawerForm as any)?.openDrawer()
})

// Close drawer buttons
document.querySelectorAll('.close-drawer-sm').forEach((btn) => {
  btn.addEventListener('click', () => {
    ;(drawerSm as any)?.closeDrawer()
  })
})

document.querySelectorAll('.close-drawer-md').forEach((btn) => {
  btn.addEventListener('click', () => {
    ;(drawerMd as any)?.closeDrawer()
  })
})

document.querySelectorAll('.close-drawer-lg').forEach((btn) => {
  btn.addEventListener('click', () => {
    ;(drawerLg as any)?.closeDrawer()
  })
})

document.querySelectorAll('.close-drawer-form').forEach((btn) => {
  btn.addEventListener('click', () => {
    ;(drawerForm as any)?.closeDrawer()
  })
})

// Select component examples
const selectCountry = document.getElementById('select-country') as any
const selectSearchable = document.getElementById('select-searchable') as any
const selectRequired = document.getElementById('select-required') as any
const selectError = document.getElementById('select-error') as any
const selectHint = document.getElementById('select-hint') as any
const selectDisabled = document.getElementById('select-disabled') as any
const selectSmall = document.getElementById('select-small') as any
const selectLarge = document.getElementById('select-large') as any

// Country options
if (selectCountry) {
  selectCountry.options = [
    { label: 'United States', value: 'us' },
    { label: 'Canada', value: 'ca' },
    { label: 'United Kingdom', value: 'uk' },
    { label: 'Germany', value: 'de' },
    { label: 'France', value: 'fr' },
    { label: 'Japan', value: 'jp' },
    { label: 'Australia', value: 'au' },
  ]
}

// Searchable fruits
if (selectSearchable) {
  selectSearchable.options = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
    { label: 'Dragon Fruit', value: 'dragon-fruit' },
    { label: 'Elderberry', value: 'elderberry' },
    { label: 'Fig', value: 'fig' },
    { label: 'Grape', value: 'grape' },
    { label: 'Honeydew', value: 'honeydew' },
    { label: 'Kiwi', value: 'kiwi' },
    { label: 'Lemon', value: 'lemon' },
    { label: 'Mango', value: 'mango' },
    { label: 'Orange', value: 'orange' },
    { label: 'Papaya', value: 'papaya' },
    { label: 'Strawberry', value: 'strawberry' },
  ]
}

// Required field options
if (selectRequired) {
  selectRequired.options = [
    { label: 'Option 1', value: 'opt1' },
    { label: 'Option 2', value: 'opt2' },
    { label: 'Option 3', value: 'opt3' },
  ]
}

// Error state options
if (selectError) {
  selectError.options = [
    { label: 'Choice A', value: 'a' },
    { label: 'Choice B', value: 'b' },
    { label: 'Choice C', value: 'c' },
  ]
}

// Priority options
if (selectHint) {
  selectHint.options = [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Critical', value: 'critical' },
  ]
}

// Disabled options
if (selectDisabled) {
  selectDisabled.options = [
    { label: 'Not Available', value: 'na' },
  ]
}

// Small select options
if (selectSmall) {
  selectSmall.options = [
    { label: 'Small 1', value: 's1' },
    { label: 'Small 2', value: 's2' },
    { label: 'Small 3', value: 's3' },
  ]
}

// Large select options
if (selectLarge) {
  selectLarge.options = [
    { label: 'Large 1', value: 'l1' },
    { label: 'Large 2', value: 'l2' },
    { label: 'Large 3', value: 'l3' },
  ]
}

// Quantity select examples
const quantityXs = document.getElementById('quantity-xs') as any
const quantitySm = document.getElementById('quantity-sm') as any
const quantityMd = document.getElementById('quantity-md') as any
const quantityLg = document.getElementById('quantity-lg') as any
const quantityLimited = document.getElementById('quantity-limited') as any
const quantityNoInput = document.getElementById('quantity-no-input') as any

// Set allowInput to false for the no-input example
if (quantityNoInput) {
  quantityNoInput.allowInput = false
}

// Get display elements
const quantityXsDisplay = document.getElementById('quantity-xs-display')
const quantitySmDisplay = document.getElementById('quantity-sm-display')
const quantityMdDisplay = document.getElementById('quantity-md-display')
const quantityLgDisplay = document.getElementById('quantity-lg-display')
const quantityLimitedDisplay = document.getElementById('quantity-limited-display')
const quantityNoInputDisplay = document.getElementById('quantity-no-input-display')

// Add change listeners to update display elements
const quantityComponents = [
  { element: quantityXs, display: quantityXsDisplay },
  { element: quantitySm, display: quantitySmDisplay },
  { element: quantityMd, display: quantityMdDisplay },
  { element: quantityLg, display: quantityLgDisplay },
  { element: quantityLimited, display: quantityLimitedDisplay },
  { element: quantityNoInput, display: quantityNoInputDisplay },
]

quantityComponents.forEach(({ element, display }) => {
  if (element && display) {
    element.addEventListener('change', (event: Event) => {
      const customEvent = event as CustomEvent
      display.textContent = `Current value: ${customEvent.detail.value}`
    })
  }
})

// Tabs component example - theme preference select
const selectThemePreference = document.getElementById('select-theme-preference') as any
if (selectThemePreference) {
  selectThemePreference.options = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'Retro', value: 'retro' },
  ]
}

// Toggle tabs layout button
const toggleTabsLayoutButton = document.getElementById('toggle-tabs-layout')
const baseTabs = document.querySelector('base-tabs') as any

if (toggleTabsLayoutButton && baseTabs) {
  toggleTabsLayoutButton.addEventListener('click', () => {
    const currentVariant = baseTabs.getAttribute('variant') || 'horizontal'
    const newVariant = currentVariant === 'horizontal' ? 'sidebar' : 'horizontal'
    baseTabs.setAttribute('variant', newVariant)
  })
}

// Custom theme toggle examples
const toggleLightDark = document.getElementById('toggle-light-dark') as any
const toggleFun = document.getElementById('toggle-fun') as any

// Configure light/dark only toggle
if (toggleLightDark) {
  toggleLightDark.themes = [
    {
      theme: 'light',
      icon: `<svg viewBox="0 0 20 20" fill="currentColor" class="theme-icon" aria-hidden="true">
        <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" fill-rule="evenodd"/>
      </svg>`,
    },
    {
      theme: 'dark',
      icon: `<svg viewBox="0 0 20 20" fill="currentColor" class="theme-icon" aria-hidden="true">
        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
      </svg>`,
    },
  ]
}

// Configure fun themes toggle (retro, neo-tokyo, tropical-clay)
if (toggleFun) {
  toggleFun.themes = [
    {
      theme: 'retro',
      icon: `<svg viewBox="0 0 20 20" fill="currentColor" class="theme-icon" aria-hidden="true">
        <path d="M2 4a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm3 1a1 1 0 011-1h8a1 1 0 011 1v8a1 1 0 01-1 1H6a1 1 0 01-1-1V5z"/>
      </svg>`,
    },
    {
      theme: 'neo-tokyo',
      icon: `<svg viewBox="0 0 20 20" fill="currentColor" class="theme-icon" aria-hidden="true">
        <path d="M13 7H7v6h6V7z"/><path fill-rule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clip-rule="evenodd"/>
      </svg>`,
    },
    {
      theme: 'tropical-clay',
      icon: `<svg viewBox="0 0 20 20" fill="currentColor" class="theme-icon" aria-hidden="true">
        <path fill-rule="evenodd" d="M5.05 3.636a1 1 0 010 1.414 7 7 0 000 9.9 1 1 0 11-1.414 1.414 9 9 0 010-12.728 1 1 0 011.414 0zm9.9 0a1 1 0 011.414 0 9 9 0 010 12.728 1 1 0 11-1.414-1.414 7 7 0 000-9.9 1 1 0 010-1.414zM7.879 6.464a1 1 0 010 1.414 3 3 0 000 4.243 1 1 0 11-1.415 1.414 5 5 0 010-7.07 1 1 0 011.415 0zm4.242 0a1 1 0 011.415 0 5 5 0 010 7.072 1 1 0 01-1.415-1.415 3 3 0 000-4.242 1 1 0 010-1.415zM10 9a1 1 0 011 1v.01a1 1 0 11-2 0V10a1 1 0 011-1z" clip-rule="evenodd"/>
      </svg>`,
    },
    {
      theme: 'ocean',
      icon: `<svg viewBox="0 0 20 20" fill="currentColor" class="theme-icon" aria-hidden="true">
        <path d="M2 10c2 0 2-4 4-4s2 4 4 4 2-4 4-4 2 4 4 4v6H2v-6z"/>
      </svg>`,
    },
  ]
}

