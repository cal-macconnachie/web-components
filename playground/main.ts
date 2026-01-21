import { registerAll } from '../src'
import { showToast } from '../src/components/base-toast'

registerAll()

await customElements.whenDefined('auth-form')
await customElements.whenDefined('base-drawer')
await customElements.whenDefined('base-button')
await customElements.whenDefined('base-toast')
await customElements.whenDefined('base-list')
await customElements.whenDefined('base-list-item')


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

// showToast function demo button
document.getElementById('show-function-toast-btn')?.addEventListener('click', () => {
  const messageInput = document.getElementById('toast-message-input') as any
  const variantSelect = document.getElementById('toast-variant-select') as any
  const positionSelect = document.getElementById('toast-position-select') as any
  const dismissSelect = document.getElementById('toast-dismiss-select') as any

  const message = messageInput?.value || 'Default message'
  const variant = variantSelect?.value || 'default'
  const position = positionSelect?.value || 'top-right'
  const dismiss = dismissSelect?.value || '2s'

  showToast({
    message,
    variant,
    position,
    dismiss
  })
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

// Detents drawer examples
const drawerDetents = document.getElementById('drawer-detents')
const drawerControl = document.getElementById('drawer-control')

// Open detents drawer
document.querySelector('.open-drawer-detents')?.addEventListener('click', () => {
  ;(drawerDetents as any)?.openDrawer()
})

// Close detents drawer
document.querySelectorAll('.close-drawer-detents').forEach((btn) => {
  btn.addEventListener('click', () => {
    ;(drawerDetents as any)?.closeDrawer()
  })
})

// Listen to detent changes for detents drawer
drawerDetents?.addEventListener('drawer-detent-change', (event: any) => {
  const display = document.getElementById('current-detent-display')
  if (display) {
    display.textContent = `${event.detail.detentIndex} (${event.detail.detentHeight}dvh)`
  }
})

// Open control drawer
document.querySelector('.open-drawer-control')?.addEventListener('click', () => {
  ;(drawerControl as any)?.openDrawer()
})

// Close control drawer
document.querySelectorAll('.close-drawer-control').forEach((btn) => {
  btn.addEventListener('click', () => {
    ;(drawerControl as any)?.closeDrawer()
  })
})

// Set detent buttons for control drawer
document.querySelectorAll('.set-detent-0').forEach((btn) => {
  btn.addEventListener('click', () => {
    ;(drawerControl as any)?.setDetent(0)
  })
})

document.querySelectorAll('.set-detent-1').forEach((btn) => {
  btn.addEventListener('click', () => {
    ;(drawerControl as any)?.setDetent(1)
  })
})

document.querySelectorAll('.set-detent-2').forEach((btn) => {
  btn.addEventListener('click', () => {
    ;(drawerControl as any)?.setDetent(2)
  })
})

document.querySelectorAll('.set-detent-3').forEach((btn) => {
  btn.addEventListener('click', () => {
    ;(drawerControl as any)?.setDetent(3)
  })
})

// Detent select dropdown for control drawer
const detentSelect = document.getElementById('detent-select') as HTMLSelectElement
detentSelect?.addEventListener('change', () => {
  const index = parseInt(detentSelect.value)
  ;(drawerControl as any)?.setDetent(index)
})

// Listen to detent changes for control drawer
drawerControl?.addEventListener('drawer-detent-change', (event: any) => {
  const display = document.getElementById('current-control-detent')
  if (display) {
    display.textContent = `Detent ${event.detail.detentIndex} (${event.detail.detentHeight}dvh)`
  }
  // Update select dropdown
  if (detentSelect) {
    detentSelect.value = event.detail.detentIndex.toString()
  }
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
      icon: 'sun',
    },
    {
      theme: 'dark',
      icon: 'moon',
    },
  ]
}

// Configure fun themes toggle (retro, neo-tokyo, tropical-clay)
if (toggleFun) {
  toggleFun.themes = [
    {
      theme: 'retro',
      icon: 'cog',
    },
    {
      theme: 'neo-tokyo',
      icon: 'filters',
    },
    {
      theme: 'tropical-clay',
      icon: 'sun',
    },
    {
      theme: 'ocean',
      icon: 'share',
    },
  ]
}

// List swipe actions demo
const swipeItem1 = document.getElementById('swipe-item-1') as any
const swipeItem2 = document.getElementById('swipe-item-2') as any
const swipeItem3 = document.getElementById('swipe-item-3') as any

if (swipeItem1) {
  swipeItem1.leftSwipeAction = {
    icon: 'open-email',
    callback: () => {
      showToast({
        message: 'Message marked as read!',
        variant: 'success',
        position: 'bottom-center',
        dismiss: '2s'
      })
    },
    color: '#22c55e',
    label: 'Read'
  }

  swipeItem1.rightSwipeAction = {
    icon: 'file-cabinet',
    callback: () => {
      showToast({
        message: 'Message deleted!',
        variant: 'danger',
        position: 'bottom-center',
        dismiss: '2s'
      })
    },
    color: '#ef4444',
    label: 'Delete'
  }
}

if (swipeItem2) {
  swipeItem2.leftSwipeAction = {
    icon: 'file-cabinet',
    callback: () => {
      showToast({
        message: 'Update archived!',
        variant: 'info',
        position: 'bottom-center',
        dismiss: '2s'
      })
    },
    color: '#3b82f6',
    label: 'Archive'
  }

  swipeItem2.rightSwipeAction = {
    icon: 'file-cabinet',
    callback: () => {
      showToast({
        message: 'Update deleted!',
        variant: 'danger',
        position: 'bottom-center',
        dismiss: '2s'
      })
    },
    color: '#ef4444',
    label: 'Delete'
  }
}

if (swipeItem3) {
  swipeItem3.leftSwipeAction = {
    icon: 'open-email',
    callback: () => {
      showToast({
        message: 'Marked as done!',
        variant: 'success',
        position: 'bottom-center',
        dismiss: '2s'
      })
    },
    color: 'transparent',
    iconColor: '#22c55e',
    label: 'Done'
  }

  swipeItem3.rightSwipeAction = {
    icon: 'arrow',
    callback: () => {
      showToast({
        message: 'Reminder dismissed!',
        variant: 'warning',
        position: 'bottom-center',
        dismiss: '2s'
      })
    },
    color: 'transparent',
    iconColor: '#f59e0b',
    label: 'Dismiss'
  }
}

// Interactive list item click handlers
const listItems = ['list-item-home', 'list-item-dashboard', 'list-item-analytics']
listItems.forEach(id => {
  const item = document.getElementById(id)
  item?.addEventListener('item-click', (e: any) => {
    // Remove selected from all items
    listItems.forEach(itemId => {
      document.getElementById(itemId)?.removeAttribute('selected')
    })
    // Add selected to clicked item
    e.detail.item.setAttribute('selected', '')
  })
})

