# Component Library Documentation

This document provides comprehensive documentation for all reusable CSS components available in the web-components design system.

## Table of Contents

- [Overview](#overview)
- [Usage](#usage)
- [Components](#components)
  - [Navigation Bar](#navigation-bar)
  - [Search](#search)
  - [Buttons](#buttons)
  - [Toast/Notifications](#toastnotifications)
  - [Sidebar](#sidebar)
  - [Breadcrumb](#breadcrumb)
  - [Toolbar](#toolbar)
  - [Loading States](#loading-states)
  - [Empty States](#empty-states)
  - [Lightbox/Modal](#lightboxmodal)
  - [Zoom Controls](#zoom-controls)

## Overview

The component library provides a comprehensive set of pre-styled, accessible, and responsive UI components that work seamlessly with the design system tokens defined in `main.css`.

All components:
- Use design system tokens for consistent styling
- Support both light and dark themes
- Are fully responsive
- Include hover/focus/active states
- Follow accessibility best practices

## Usage

### Via CDN

Include the stylesheet in your HTML:

```html
<link rel="stylesheet" href="https://your-cdn-url/main.css">
```

### Via NPM

```bash
npm install @cal.macconnachie/web-components
```

```javascript
import '@cal.macconnachie/web-components/dist/main.css'
```

## Components

### Navigation Bar

A flexible navigation bar component with support for blur effects.

**Basic Usage:**

```html
<nav class="nav-bar">
  <div class="nav-left">
    <h1 class="app-title">My App</h1>
  </div>
  <div class="nav-center">
    <!-- Search or other centered content -->
  </div>
  <div class="nav-right">
    <!-- Icons, buttons, etc. -->
  </div>
</nav>
```

**With Blur Effect:**

```html
<nav class="nav-bar nav-bar--blur">
  <!-- Content -->
</nav>
```

**With Gradient Title:**

```html
<h1 class="app-title app-title--gradient">My App</h1>
```

**Classes:**
- `.nav-bar` - Main navigation bar container
- `.nav-bar--blur` - Adds glassmorphism blur effect
- `.nav-left`, `.nav-center`, `.nav-right` - Navigation sections
- `.app-title` - Application title
- `.app-title--gradient` - Gradient text effect

---

### Search

A search input component with icon and clear button.

**Usage:**

```html
<div class="search-container">
  <span class="search-icon">🔍</span>
  <input
    type="text"
    class="search-input"
    placeholder="Search..."
    id="searchInput"
  >
  <button class="clear-search" onclick="clearSearch()">✕</button>
</div>
```

**Classes:**
- `.search-container` - Search component wrapper
- `.search-icon` - Icon positioned at left
- `.search-input` - Input field
- `.clear-search` - Clear button positioned at right

**Features:**
- Auto-focus styles
- Hover states
- Responsive width (max 400px)

---

### Buttons

#### Icon Button

Square buttons optimized for icons.

**Usage:**

```html
<button class="icon-btn">
  <span>🔄</span>
</button>

<!-- Sizes -->
<button class="icon-btn icon-btn--sm">↻</button>
<button class="icon-btn">↻</button>
<button class="icon-btn icon-btn--lg">↻</button>
```

**Classes:**
- `.icon-btn` - Base icon button (36x36px)
- `.icon-btn--sm` - Small variant (32x32px)
- `.icon-btn--lg` - Large variant (44x44px)

**States:**
- `:hover` - Slight lift effect
- `:active` - Press effect
- `:disabled` - Reduced opacity, no interaction

---

### Toast/Notifications

Fixed position toast notifications for user feedback.

**Usage:**

```html
<div class="toast toast--success">
  <span class="toast-icon">✓</span>
  <span class="toast-message">Action completed successfully!</span>
  <button class="toast-close">✕</button>
</div>
```

**Variants:**

```html
<div class="toast toast--error"><!-- Error message --></div>
<div class="toast toast--success"><!-- Success message --></div>
<div class="toast toast--warning"><!-- Warning message --></div>
<div class="toast toast--info"><!-- Info message --></div>
```

**Classes:**
- `.toast` - Base toast container
- `.toast--error` - Error variant (red)
- `.toast--success` - Success variant (green)
- `.toast--warning` - Warning variant (orange)
- `.toast--info` - Info variant (blue)
- `.toast-icon` - Icon element
- `.toast-message` - Message text
- `.toast-close` - Close button

**Animations:**
- `.toast-enter-active`, `.toast-leave-active` - Transition classes
- `.toast-enter-from`, `.toast-leave-to` - Animation states

---

### Sidebar

A collapsible sidebar with resizable support.

**Usage:**

```html
<aside class="sidebar" style="width: 300px">
  <div class="sidebar-header">
    <h2 class="sidebar-title">Files</h2>
    <span class="sidebar-subtitle">24 items</span>
  </div>

  <div class="sidebar-content">
    <!-- Sidebar content -->
  </div>

  <!-- Optional resize handle -->
  <div class="resize-handle"></div>
</aside>
```

**Classes:**
- `.sidebar` - Main sidebar container
- `.sidebar-header` - Header section
- `.sidebar-title` - Title text
- `.sidebar-subtitle` - Subtitle/count text
- `.sidebar-content` - Scrollable content area
- `.resize-handle` - Draggable resize handle

**Features:**
- Resizable (min: 250px, max: 600px)
- Custom scrollbar styling
- Responsive (absolute positioned on mobile)

---

### Breadcrumb

Hierarchical navigation component.

**Usage:**

```html
<nav class="breadcrumb">
  <button class="breadcrumb-item" onclick="goHome()">Home</button>
  <span class="breadcrumb-separator">/</span>
  <button class="breadcrumb-item" onclick="goToFolder()">Documents</button>
  <span class="breadcrumb-separator">/</span>
  <button class="breadcrumb-item">Photos</button>
</nav>
```

**Classes:**
- `.breadcrumb` - Breadcrumb container
- `.breadcrumb-item` - Individual breadcrumb link/button
- `.breadcrumb-separator` - Separator between items

**Features:**
- Horizontal scroll on overflow
- Hover states
- Works with `<button>`, `<a>`, or `<span>` elements

---

### Toolbar

Flexible toolbar for content actions.

**Usage:**

```html
<div class="toolbar">
  <div class="toolbar-left">
    <h3 class="toolbar-title">Image_2024.jpg</h3>
    <span class="toolbar-subtitle">2.4 MB</span>
  </div>

  <div class="toolbar-right">
    <button class="icon-btn">⟲</button>
    <button class="icon-btn">↓</button>
  </div>
</div>
```

**With Blur:**

```html
<div class="toolbar toolbar--blur">
  <!-- Content -->
</div>
```

**Classes:**
- `.toolbar` - Main toolbar container
- `.toolbar--blur` - Blur effect variant
- `.toolbar-left` - Left section (title/subtitle)
- `.toolbar-right` - Right section (actions)
- `.toolbar-title` - Title text (truncates)
- `.toolbar-subtitle` - Subtitle text

---

### Loading States

#### Spinner

Animated loading spinner.

**Usage:**

```html
<div class="spinner"></div>

<!-- Sizes -->
<div class="spinner spinner--sm"></div>
<div class="spinner"></div>
<div class="spinner spinner--lg"></div>
```

**Classes:**
- `.spinner` - Default spinner (40x40px)
- `.spinner--sm` - Small spinner (24x24px)
- `.spinner--lg` - Large spinner (56x56px)

#### Loading State Container

Complete loading state with spinner and text.

**Usage:**

```html
<div class="loading-state">
  <div class="spinner"></div>
  <p class="loading-state__text">Loading media...</p>
</div>
```

**Classes:**
- `.loading-state` - Loading container (centered, full height)
- `.loading-state__text` - Loading message text

---

### Empty States

Friendly empty state displays.

**Usage:**

```html
<div class="empty-state">
  <div class="empty-state__icon">📁</div>
  <h2 class="empty-state__title">No files found</h2>
  <p class="empty-state__description">
    Upload your first file to get started
  </p>
  <button class="base-button base-button--primary">Upload File</button>
</div>
```

**Classes:**
- `.empty-state` - Main empty state container
- `.empty-state__icon` - Large icon/emoji
- `.empty-state__title` - Title text
- `.empty-state__description` - Description text (max-width: 400px)

---

### Lightbox/Modal

Full-screen modal overlay for media viewing.

**Usage:**

```html
<div class="lightbox">
  <button class="lightbox__close" onclick="closeLightbox()">✕</button>

  <!-- Optional navigation -->
  <button class="lightbox__nav lightbox__nav--prev">‹</button>
  <button class="lightbox__nav lightbox__nav--next">›</button>

  <div class="lightbox__content">
    <img src="image.jpg" alt="Image">
  </div>

  <!-- Optional footer -->
  <div class="lightbox__footer">
    <span>image.jpg</span>
    <span>1 / 10</span>
  </div>
</div>
```

**Classes:**
- `.lightbox` - Full-screen overlay
- `.lightbox__close` - Close button (top-right)
- `.lightbox__nav` - Navigation button
- `.lightbox__nav--prev` - Previous button (left)
- `.lightbox__nav--next` - Next button (right)
- `.lightbox__content` - Content container
- `.lightbox__footer` - Footer info section

**Animations:**
- `.lightbox-enter-active`, `.lightbox-leave-active`
- `.lightbox-enter-from`, `.lightbox-leave-to`

**Features:**
- Backdrop blur effect
- Centered content
- Responsive navigation
- High z-index (modal layer)

---

### Zoom Controls

Floating zoom control widget.

**Usage:**

```html
<div class="zoom-controls">
  <button class="zoom-btn" onclick="zoomOut()">−</button>
  <span class="zoom-level">100%</span>
  <button class="zoom-btn" onclick="zoomIn()">+</button>
  <button class="zoom-btn" onclick="resetZoom()">Reset</button>
</div>
```

**Classes:**
- `.zoom-controls` - Controls container (floating)
- `.zoom-btn` - Zoom button
- `.zoom-level` - Current zoom display

**Features:**
- Pill-shaped design
- Hover states
- Fixed minimum width for zoom display

---

## Responsive Behavior

All components include responsive breakpoints at 768px:

- **Navigation:** Wraps on mobile, search moves to bottom
- **Sidebar:** Becomes absolute positioned overlay
- **Lightbox:** Smaller navigation buttons
- **Toolbars:** Adjusted padding

## Dark Theme Support

All components automatically adapt to dark theme when `[data-theme='dark']` is applied to the document root:

```html
<html data-theme="dark">
  <!-- Your app -->
</html>
```

Or toggle dynamically:

```javascript
document.documentElement.setAttribute('data-theme', 'dark')
```

## Accessibility

All components include:
- Proper focus states (`:focus-visible`)
- Keyboard navigation support
- Semantic HTML structure
- ARIA labels where appropriate
- Screen reader friendly text

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 12+, Chrome Android 90+

## Examples

See the [examples directory](./examples) for complete working examples of each component.

## Contributing

To add new components:

1. Add styles to `src/stylesheets/main.css`
2. Use design system tokens (never hardcode values)
3. Support both light and dark themes
4. Add responsive breakpoints
5. Document the component in this file
6. Create an example in `/examples`

## License

MIT License - see LICENSE file for details
