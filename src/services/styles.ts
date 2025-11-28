import { css } from 'lit'

export const appStyles = () => {
  const baseStyles = css`
    :host {
      display: inline-block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      box-sizing: border-box;
      --color-primary: var(--cals-auth-color-primary, #2563eb);
      --color-bg-primary: var(--cals-auth-color-bg-primary, #ffffff);
      --color-bg-secondary: var(--cals-auth-color-bg-secondary, #f8fafc);
      --color-text-primary: var(--cals-auth-color-text-primary, #0f172a);
      --color-text-secondary: var(--cals-auth-color-text-secondary, #64748b);
      --color-text-muted: var(--cals-auth-color-text-muted, #94a3b8);
      --color-border: var(--cals-auth-color-border, #e2e8f0);
      --color-error: var(--cals-auth-color-error, #dc2626);
      --color-success: var(--cals-auth-color-success, #16a34a);
      --transition-slow: var(--cals-auth-transition-slow, 300ms);
      --radius-md: var(--cals-auth-radius-md, 0.5rem);
      --radius-lg: var(--cals-auth-radius-lg, 0.75rem);
      --radius-xl: var(--cals-auth-radius-xl, 1.25rem);
      --space-2: var(--cals-auth-space-2, 0.5rem);
      --space-3: var(--cals-auth-space-3, 0.75rem);
      --space-4: var(--cals-auth-space-4, 1rem);
      --space-5: var(--cals-auth-space-5, 1.25rem);
      --space-6: var(--cals-auth-space-6, 1.5rem);
    }

    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    /* Body scroll lock */
    :host(.modal-open) {
      overflow: hidden;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: flex-end;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: none;
      animation: fadeIn 0.2s ease-out;
    }

    .modal-overlay--closing {
      animation: fadeOut var(--transition-slow) ease-out forwards;
    }

    .modal-container {
      background: var(--color-bg-primary);
      border-top-left-radius: var(--radius-xl);
      border-top-right-radius: var(--radius-xl);
      box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06);
      width: 100vw;
      max-width: 100vw;
      height: 90dvh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: slideUp var(--transition-slow);
      transform-origin: bottom center;
      transition: height var(--transition-slow) cubic-bezier(0.4, 0, 0.2, 1);
    }

    .modal-container--closing {
      animation: slideDown var(--transition-slow);
    }

    .modal-container--dragging {
      user-select: none;
      -webkit-user-select: none;
      cursor: grabbing;
    }

    .drawer-handle {
      display: flex;
      justify-content: center;
      padding-top: var(--space-3);
      padding-bottom: var(--space-2);
      flex-shrink: 0;
      cursor: pointer;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }

    .drawer-handle:hover .drawer-handle-bar {
      opacity: 0.7;
    }

    .drawer-handle-bar {
      width: 36px;
      height: 5px;
      background: var(--color-text-muted);
      border-radius: 100px;
      opacity: 0.5;
      transition: opacity var(--transition-slow) ease;
    }

    .drawer-content {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      height: 100%;
    }

    .drawer-content--sm {
      max-width: 400px;
    }

    .drawer-content--md {
      max-width: 600px;
    }

    .drawer-content--lg {
      max-width: 900px;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-4) var(--space-6);
      flex-shrink: 0;
    }

    .auth-logo {
      display: block;
    }

    .modal-body {
      padding: var(--space-4) var(--space-6);
      overflow-y: auto;
      flex: 1;
      min-height: 0;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .field-label {
      font-weight: 500;
      font-size: 0.875rem;
      color: var(--color-text-primary);
    }

    .field-input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-bg-primary);
      color: var(--color-text-primary);
      font-size: 1rem;
      transition: all 0.15s ease;
    }

    .field-input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 25%, transparent);
    }

    .field-input:-webkit-autofill,
    .field-input:-webkit-autofill:hover,
    .field-input:-webkit-autofill:focus,
    .field-input:-webkit-autofill:active {
      -webkit-box-shadow: 0 0 0 1000px var(--color-bg-primary) inset !important;
      -webkit-text-fill-color: var(--color-text-primary) !important;
      transition: background-color 5000s ease-in-out 0s;
    }

    .field-input:-moz-autofill {
      box-shadow: 0 0 0 1000px var(--color-bg-primary) inset !important;
      color: var(--color-text-primary) !important;
    }

    .field-input--error {
      border-color: var(--color-error);
    }

    .field-error {
      color: var(--color-error);
      font-size: 0.875rem;
    }

    .forgot-row {
      display: flex;
      justify-content: flex-end;
      margin-top: calc(var(--space-2) * -1);
    }

    .text-btn {
      background: none;
      border: none;
      color: var(--color-primary);
      cursor: pointer;
      font-weight: 600;
      font-size: 0.875rem;
      padding: 0;
      text-decoration: none;
    }

    .text-btn:hover {
      text-decoration: underline;
    }

    .form-actions {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      margin-top: var(--space-2);
    }

    .cta {
      width: 100%;
      padding: 0.875rem 1rem;
      border: none;
      border-radius: var(--radius-md);
      background: var(--color-primary);
      color: white;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .cta:hover:not(:disabled) {
      background: color-mix(in srgb, var(--color-primary), black 10%);
      transform: translateY(-1px);
    }

    .cta:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .button-row {
      display: flex;
      gap: var(--space-3);
      width: 100%;
    }

    .oauth-btn {
      flex: 1;
      padding: 0.875rem 1rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-bg-primary);
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .oauth-btn:hover:not(:disabled) {
      background: var(--color-bg-secondary);
      border-color: var(--color-text-muted);
    }

    .oauth-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .apple-icon path {
      fill: #0b0b0a;
    }

    /* Dark theme */
    :host([data-theme='dark']) {
      --color-primary: #3b82f6;
      --color-bg-primary: #1e293b;
      --color-bg-secondary: #0f172a;
      --color-text-primary: #f8fafc;
      --color-text-secondary: #cbd5e1;
      --color-text-muted: #94a3b8;
      --color-border: #334155;
      --color-error: #ef4444;
      --color-success: #10b981;
    }

    :host([data-theme='dark']) .apple-icon path {
      fill: #8e8e93;
    }

    @media (prefers-color-scheme: dark) {
      .apple-icon path {
        fill: #8e8e93;
      }
    }

    .otp-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .otp-label {
      display: block;
      font-weight: 500;
      font-size: 0.875rem;
      color: var(--color-text-primary);
    }

    .otp-inputs {
      display: flex;
      gap: var(--space-2);
      justify-content: center;
    }

    .otp-input {
      width: 44px;
      height: 52px;
      text-align: center;
      font-size: 1.25rem;
      font-weight: 600;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-bg-primary);
      color: var(--color-text-primary);
      transition: all 0.15s ease;
    }

    .otp-input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 25%, transparent);
    }

    .otp-input--error {
      border-color: var(--color-error);
    }

    .otp-error {
      margin: 0;
      color: var(--color-error);
      font-size: 0.875rem;
      text-align: center;
    }

    .new-password-fields {
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
      animation: fadeSlide 0.2s ease;
    }

    .alert {
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2);
    }

    .alert--success {
      background: color-mix(in srgb, var(--color-success) 10%, transparent);
      border: 1px solid color-mix(in srgb, var(--color-success) 30%, transparent);
      color: var(--color-success);
    }

    .alert--error {
      background: color-mix(in srgb, var(--color-error) 10%, transparent);
      border: 1px solid color-mix(in srgb, var(--color-error) 30%, transparent);
      color: var(--color-error);
    }

    .alert-close {
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      font-size: 1.5rem;
      line-height: 1;
      padding: 0;
      opacity: 0.7;
    }

    .alert-close:hover {
      opacity: 1;
    }

    .auth-footer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      padding-top: var(--space-4);
      text-align: center;
    }

    .toggle-text {
      margin: 0;
      font-size: 0.875rem;
      color: var(--color-text-secondary);
    }

    .toggle-text a {
      color: var(--color-primary);
      text-decoration: none;
    }

    .toggle-text a:hover {
      text-decoration: underline;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes fadeOut {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }

    @keyframes slideUp {
      from {
        transform: translateY(100%);
      }
      to {
        transform: translateY(0);
      }
    }

    @keyframes slideDown {
      from {
        transform: translateY(0);
      }
      to {
        transform: translateY(100%);
      }
    }

    @keyframes fadeSlide {
      from {
        opacity: 0;
        transform: translateY(6px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 640px) {
      .modal-container {
        height: 80dvh;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      * {
        animation: none !important;
        transition: none !important;
      }
    }`
  return baseStyles
}
