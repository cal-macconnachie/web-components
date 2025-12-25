import { registerAuthForm } from '../components/auth-form.js'
import { registerBaseButton } from '../components/base-button.js'
import { registerBaseCard } from '../components/base-card.js'
import { registerBaseDatePicker } from '../components/base-date-picker.js'
import { registerBaseDateTimePicker } from '../components/base-datetime-picker.js'
import { registerBaseDrawer } from '../components/base-drawer.js'
import { registerBaseInput } from '../components/base-input.js'
import { registerBaseSelect } from '../components/base-select.js'
import { registerBaseTab } from '../components/base-tab.js'
import { registerBaseTabs } from '../components/base-tabs.js'
import { registerBaseTextarea } from '../components/base-textarea.js'
import { registerBaseTimePicker } from '../components/base-time-picker.js'
import { registerBaseToast } from '../components/base-toast.js'
import { registerQuantitySelect } from '../components/quantity-select.js'
import { registerThemeToggle } from '../components/theme-toggle.js'

/**
 * Registers all web components in the custom elements registry.
 *
 * Components will only be registered once due to the check in each
 * register helper function.
 *
 * @example
 * // For CDN usage
 * import { registerAll } from 'https://cdn.example.com/index.js'
 * registerAll()
 *
 * @example
 * // For npm usage
 * import { registerAll } from '@your-package/web-components'
 * registerAll()
 */
export function registerAll() {
  registerAuthForm()
  registerBaseButton()
  registerBaseCard()
  registerBaseDatePicker()
  registerBaseDateTimePicker()
  registerBaseDrawer()
  registerBaseInput()
  registerBaseSelect()
  registerBaseTab()
  registerBaseTabs()
  registerBaseTextarea()
  registerBaseTimePicker()
  registerBaseToast()
  registerQuantitySelect()
  registerThemeToggle()
}
