import type { AuthForm } from './components/auth-form'
import type { BaseDrawer } from './components/base-drawer'
import type { BaseButton } from './components/base-button'
import type { ThemeToggle } from './components/theme-toggle'

declare global {
  interface Window {
    DEBUG_LOGS?: string;
  }
  interface HTMLElementTagNameMap {
    'auth-form': AuthForm
    'base-drawer': BaseDrawer
    'base-button': BaseButton
    'theme-toggle': ThemeToggle
  }

  interface HTMLElementEventMap {
    'auth:logged-in': CustomEvent<{ authToken: string; accessToken: string; email: string }>;
    'auth:logged-out': CustomEvent<void>;
    'auth:error': CustomEvent<{ message: string }>;
    'auth-success': CustomEvent<void>;
    'drawer-close': CustomEvent<void>;
    'theme-changed': CustomEvent<{ theme: 'light' | 'dark' }>;
  }
}

export { }

