# Cals Web Components

Repo to handle any and all web components I may want to build

## Install & use

### Option 1: Load the full bundle (all components)

Load all components from the CDN:

```html
<script type="module" src="https://cdn.cals-api.com/index"></script>
```

### Option 2: Load individual components (recommended)

Load only the components you need:

```html
<!-- Load just the auth component -->
<script type="module" src="https://cdn.cals-api.com/components/auth.js"></script>
```

### Option 3: Using with Vue, React, or other frameworks

For framework projects (Vue, React, etc.), load the component via script tag in your `index.html`:

```html
<!-- index.html -->
<script type="module" src="https://cdn.cals-api.com/components/auth.js"></script>
```

Then create a type declaration file for TypeScript support:

```typescript
// src/types/auth.d.ts
export interface Auth extends HTMLElement {
  openModal(): void;
  logout(): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'auth': Auth;
  }
}
```

Now you can use it with full type safety in your components:

**Vue:**
```vue
<template>
  <auth ref="authRef" app-name="Marketplace"></auth>
  <button @click="openAuth">Login / Sign up</button>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Auth } from '@/types/auth';

const authRef = ref<Auth>();

const openAuth = () => {
  authRef.value?.openModal();
};
</script>
```

**React:**
```tsx
import { useRef } from 'react';
import type { Auth } from '@/types/auth';

function App() {
  const authRef = useRef<Auth>(null);

  return (
    <>
      <auth ref={authRef} app-name="Marketplace"></auth>
      <button onClick={() => authRef.current?.openModal()}>
        Login / Sign up
      </button>
    </>
  );
}
```

### Usage Example

HTML:

```html
<auth id="auth" app-name="Marketplace"></auth>

<button id="open-auth">Login / Sign up</button>
<button id="logout-auth">Logout</button>
```

JavaScript:
```js
const auth = document.querySelector('auth');

document.getElementById('open-auth')?.addEventListener('click', () => {
  auth?.openModal();
});

document.getElementById('logout-auth')?.addEventListener('click', () => {
  auth?.logout();
});
```

TypeScript:
```typescript
import type { Auth } from 'https://cdn.cals-api.com/components/auth.js';

const auth = document.querySelector<Auth>('auth');

document.getElementById('open-auth')?.addEventListener('click', () => {
  auth?.openModal();
});

document.getElementById('logout-auth')?.addEventListener('click', () => {
  auth?.logout();
});
```

## Available Components

- `auth` - Authentication component with sign in, sign up, and password reset

## Project Structure

This repository uses Yarn workspaces to manage two packages:
- **Root package** (`web-components`): The Lit web component library
- **CDN package** (`cdn/`): AWS CDK infrastructure for deploying the component to CloudFront

## Develop

### Web Component Development
- `yarn install` – install dependencies for all workspaces
- `yarn dev` – run the Vite playground at `http://localhost:5173`
- `yarn build` – bundle the full library to `dist/`
- `yarn build:components` – build individual components to `dist/components/{component-name}/`
- `yarn typecheck` – run TypeScript without emitting

### CDK Infrastructure
- `yarn cdk:synth` – synthesize the CDK stack
- `yarn cdk:diff` – compare deployed stack with current state
- `yarn cdk:deploy` – deploy the CDK stack to AWS
- `yarn cdk:destroy` – destroy the CDK stack
- `yarn cdk <command>` – run any CDK command

## Publish

Publishing to the CDN is automated on pushes to `main` via `.github/workflows/publish.yml`.

The workflow:
1. Builds the full bundle and individual components
2. Deploys the CDK stack (S3 + CloudFront)
3. Uploads files to S3:
   - Full bundle at root: `https://cdn.cals-api.com/index.es.js`
   - Individual components: `https://cdn.cals-api.com/components/{component-name}/index.es.js`
4. Invalidates CloudFront cache

## Playground
View the playground at `https://cdn.cals-api.com/`
