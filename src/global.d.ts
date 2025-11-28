declare global {
  interface Window {
    DEBUG_LOGS?: string;
  }
  interface HTMLElementTagNameMap {
    'cals-auth': CalsAuth
  }

  interface HTMLElementEventMap {
    'cals-auth:logged-in': CustomEvent<{ authToken: string; accessToken: string; email: string }>;
    'cals-auth:logged-out': CustomEvent<void>;
    'cals-auth:error': CustomEvent<{ message: string }>;
  }
}

export { }

