declare global {
  interface Window {
    DEBUG_LOGS?: string;
  }
  interface HTMLElementTagNameMap {
    'auth': Auth
  }

  interface HTMLElementEventMap {
    'auth:logged-in': CustomEvent<{ authToken: string; accessToken: string; email: string }>;
    'auth:logged-out': CustomEvent<void>;
    'auth:error': CustomEvent<{ message: string }>;
  }
}

export { }

