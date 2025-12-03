import '../src/components/auth-form.js'
import '../src/components/base-button.js'
import '../src/components/base-card.js'
import '../src/components/base-date-picker.js'
import '../src/components/base-datetime-picker.js'
import '../src/components/base-drawer.js'
import '../src/components/base-input.js'
import '../src/components/base-select.js'
import '../src/components/base-tab.js'
import '../src/components/base-tabs.js'
import '../src/components/base-textarea.js'
import '../src/components/base-time-picker.js'
import '../src/components/quantity-select.js'
import '../src/components/theme-toggle.js'

await customElements.whenDefined('auth-form')
await customElements.whenDefined('base-drawer')

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
  console.log('Auth success - closing drawer')
  authDrawerElement.closeDrawer()
})

// Listen for drawer close event
authDrawerElement.addEventListener('drawer-close', () => {
  console.log('Drawer closed')
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
  console.log('Auth refresh failed - opening drawer')
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

// Add change listeners to log selections
;[
  selectCountry,
  selectSearchable,
  selectRequired,
  selectError,
  selectHint,
  selectSmall,
  selectLarge,
].forEach((select) => {
  if (select) {
    select.addEventListener('change', (event: CustomEvent) => {
      console.log('Select changed:', {
        id: select.id,
        value: event.detail.value,
        oldValue: event.detail.oldValue,
      })
    })
  }
})

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
    { label: 'Auto', value: 'auto' },
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

// Date Picker examples
const datePickerBasic = document.getElementById('date-picker-basic')
const datePickerRequired = document.getElementById('date-picker-required')
const datePickerHint = document.getElementById('date-picker-hint')
const datePickerError = document.getElementById('date-picker-error')
const datePickerSmall = document.getElementById('date-picker-small')
const datePickerLarge = document.getElementById('date-picker-large')

// Add change listeners to date pickers
;[
  datePickerBasic,
  datePickerRequired,
  datePickerHint,
  datePickerError,
  datePickerSmall,
  datePickerLarge,
].forEach((picker) => {
  if (picker) {
    picker.addEventListener('change', (event: Event) => {
      const customEvent = event as CustomEvent
      console.log('Date picker changed:', {
        id: (picker as HTMLElement).id,
        value: customEvent.detail.value,
        oldValue: customEvent.detail.oldValue,
      })
    })
  }
})

// Time Picker examples
const timePicker12h = document.getElementById('time-picker-12h')
const timePicker24h = document.getElementById('time-picker-24h')
const timePickerRequired = document.getElementById('time-picker-required')
const timePickerHint = document.getElementById('time-picker-hint')
const timePickerSmall = document.getElementById('time-picker-small')
const timePickerLarge = document.getElementById('time-picker-large')

// Add change listeners to time pickers
;[
  timePicker12h,
  timePicker24h,
  timePickerRequired,
  timePickerHint,
  timePickerSmall,
  timePickerLarge,
].forEach((picker) => {
  if (picker) {
    picker.addEventListener('change', (event: Event) => {
      const customEvent = event as CustomEvent
      console.log('Time picker changed:', {
        id: (picker as HTMLElement).id,
        value: customEvent.detail.value,
        oldValue: customEvent.detail.oldValue,
      })
    })
  }
})

// DateTime Picker examples
const datetimePicker12h = document.getElementById('datetime-picker-12h')
const datetimePicker24h = document.getElementById('datetime-picker-24h')
const datetimePickerRequired = document.getElementById('datetime-picker-required')
const datetimePickerHint = document.getElementById('datetime-picker-hint')
const datetimePickerSmall = document.getElementById('datetime-picker-small')
const datetimePickerLarge = document.getElementById('datetime-picker-large')

// Add change listeners to datetime pickers
;[
  datetimePicker12h,
  datetimePicker24h,
  datetimePickerRequired,
  datetimePickerHint,
  datetimePickerSmall,
  datetimePickerLarge,
].forEach((picker) => {
  if (picker) {
    picker.addEventListener('change', (event: Event) => {
      const customEvent = event as CustomEvent
      console.log('DateTime picker changed:', {
        id: (picker as HTMLElement).id,
        value: customEvent.detail.value,
        oldValue: customEvent.detail.oldValue,
      })
    })
  }
})
