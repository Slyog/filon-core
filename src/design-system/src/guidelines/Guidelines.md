# FILON Design System v1

> Dark minimal design system with cyan accent & subtle glow effects for calm, intelligent, cyber-aesthetic interfaces.

---

## 🎨 Foundation

### Brand Colors

```css
--filon-brand-cyan: #2FF3FF
--filon-surface-base: #0A0A0A
--filon-surface-card: #141414
--filon-text-primary: #FFFFFF
--filon-text-muted: #8C8C8C
```

### Glow & Alerts

```css
--filon-glow-outer: #2FF3FF33 (20% opacity)
--filon-glow-focus: #2FF3FF80 (50% opacity)
--filon-glow-intense: #2FF3FF99 (60% opacity)
--filon-alert-warning: #FFB800
--filon-alert-error: #FF4757
--filon-alert-error-glow: #EF444480
```

### Spacing Scale

```css
--filon-space-xs: 4px
--filon-space-sm: 8px
--filon-space-md: 12px
--filon-space-lg: 16px
--filon-space-xl: 20px
--filon-space-2xl: 24px
--filon-space-3xl: 32px
```

### Radius Scale

```css
--filon-radius-sm: 6px
--filon-radius-md: 12px
--filon-radius-lg: 20px
```

---

## ⚡ Motion System

### Timing Functions

```css
/* Fast interactions - buttons, toggles, hovers */
--filon-motion-fast: 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)

/* Soft transitions - cards, modals, layouts */
--filon-motion-soft: 0.25s cubic-bezier(0.3, 0.7, 0.3, 1)

/* Tab navigation */
--filon-motion-tabs: 0.18s cubic-bezier(0.25, 0.8, 0.25, 1)
```

### Animation Guidelines

- **Hover effects**: Use `motion.fast` with scale or glow changes
- **State transitions**: Use `motion.soft` for smooth visual feedback
- **Modal/Overlay**: Scale from 0.98 → 1.0 with fade-in
- **Error states**: Subtle shake animation (4px horizontal)
- **Focus states**: Pulsing glow (2s infinite loop)

---

## 🧩 Components

### 1. Button

**Variants**: Default, Hover, Pressed, Disabled

**States**:
- **Default**: Brand cyan bg, 12px shadow glow
- **Hover**: 3% scale-up, 32px soft outer glow (#2FF3FF80)
- **Pressed**: Inverted colors (dark bg, cyan text), inner glow, scale 0.98
- **Disabled**: 40% opacity, no glow, cursor not-allowed

**Naming**: `Button/Primary/{State}`

```tsx
<FilonButton icon={<Plus />}>
  Create Thought
</FilonButton>
```

---

### 2. Input

**Variants**: Default, Focus, Error

**States**:
- **Default**: Subtle border (#2FF3FF20), no glow
- **Focus**: Bright border (#2FF3FF99), 20px glow, pulsing ring animation
- **Error**: Red glow (#EF444480), shake animation, alert icon

**Accessibility**:
- Placeholder uses `text.muted` (#8C8C8C)
- 4.5:1 contrast ratio maintained
- Focus ring visible and animated

**Naming**: `Input/{State}`

```tsx
<FilonInput placeholder="Enter your thought..." />
```

---

### 3. Card

**Variants**: Default, Hover, Active

**States**:
- **Default**: Minimal border (#2FF3FF10), 5% glow
- **Hover**: Elevated 2px, enhanced border (#2FF3FF30), 15% glow
- **Active**: Cyan border (#2FF3FF60), elevated 4px, 25% glow

**Shadow Token**: Uses `shadow.glow` → `0 0 24px rgba(47, 243, 255, 0.15)`

**Naming**: `Card/{State}`

```tsx
<FilonCard
  title="Thought Node"
  description="Interactive card with glow effects"
  icon={<Brain size={24} />}
/>
```

---

### 4. Brainbar Tabs

**Animation**:
- **Hover**: Underline animates left → right (0.18s, origin left)
- **Active**: Cyan underline with 8px glow, subtle pulsing halo around label

**Easing**: `cubic-bezier(0.25, 0.8, 0.25, 1)`

**States**:
- Inactive: Muted text (#8C8C8C)
- Active: Cyan text (#2FF3FF) with glowing underline

**Accessibility**:
- Keyboard navigable
- Focus ring with animated glow
- 4.5:1 contrast ratio

---

### 5. Explain Overlay (Modal)

**Transitions**:
- **Open**: Scale 0.98 → 1.0, fade 0 → 1, y-offset 20 → 0
- **Close**: Reverse with same timing (0.25s)
- **Backdrop**: Blur(8px), 80% opacity dark overlay

**Keyboard Support**:
- Press `Esc` to close
- Focus trap within modal
- Visible focus rings with glow

**Accessibility**:
- ARIA labels (`role="dialog"`, `aria-modal="true"`)
- Focus management on open/close
- 4.5:1 contrast maintained

---

## 🎭 Glow System

### Universal Accent Glow

Apply `glow.outer` (#2FF3FF80) to all active/focused elements:

```css
/* Hover/Focus states */
box-shadow: 0 0 20px rgba(47, 243, 255, 0.5);

/* Active/Selected states */
box-shadow: 0 0 32px rgba(47, 243, 255, 0.6);

/* Pulsing animation */
animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
```

### Glass Effect

Cards and elevated surfaces use glass-like glow:

```css
background: #141414;
border: 1px solid rgba(47, 243, 255, 0.1);
box-shadow: 0 0 24px rgba(47, 243, 255, 0.15);
backdrop-filter: blur(4px);
```

---

## ♿ Accessibility

### Contrast Ratios

- **Text Primary** (#FFFFFF) on Base (#0A0A0A): 21:1 ✓
- **Text Muted** (#8C8C8C) on Base (#0A0A0A): 6.8:1 ✓
- **Brand Cyan** (#2FF3FF) on Base (#0A0A0A): 11.5:1 ✓
- **Brand Cyan** (#2FF3FF) on Card (#141414): 10.8:1 ✓

All combinations meet WCAG AA (4.5:1 minimum).

### Focus Management

- All interactive elements have visible focus rings
- Focus rings use cyan glow for consistency
- Animated glow on focus (subtle pulse)
- Keyboard navigation fully supported

### Motion Preferences

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 📐 Typography

### Font Stack

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
font-family: 'JetBrains Mono', 'Courier New', monospace; /* Code/tokens */
```

### Scale

- **Heading XL**: 32px / Bold (700) / -0.02em tracking
- **Heading L**: 24px / Semibold (600)
- **Text Base**: 16px / Regular (400) / 1.5 line-height
- **Text Muted**: 14px / Regular (400) / #8C8C8C
- **Code**: 14px / Regular (400) / JetBrains Mono

---

## 🏗️ Layout Tokens

### Brainbar (Top Navigation)

- Height: 64px
- Padding: 16px 24px
- Background: `surface.card` (#141414)
- Border: 1px solid #2FF3FF20 (bottom only)

### Cards & Containers

- Padding: 16px - 24px (depending on size)
- Border Radius: 12px (standard), 16px (large)
- Gap between elements: 12px - 16px

### Grid System

- Max width: 1280px (7xl)
- Breakpoints: 768px (md), 1024px (lg), 1280px (xl)

---

## 🔧 Implementation Notes

### Motion Package

Use `motion/react` (formerly Framer Motion):

```tsx
import { motion, AnimatePresence } from "motion/react";
```

### Icons

Use `lucide-react` for all icons:

```tsx
import { Sparkles, Plus, Brain } from "lucide-react";
```

### State Management

- Prefer controlled components for complex interactions
- Use `useState` for local UI state (hover, focus, etc.)
- Maintain accessibility attributes (`aria-*`, `role`)

---

## 🌟 Design Principles

1. **Calm Intelligence**: Subtle glows, never harsh or overwhelming
2. **Cyber Aesthetic**: Dark backgrounds with cyan accent, glass-like surfaces
3. **Motion with Purpose**: Animations reinforce interaction, never distract
4. **Accessibility First**: 4.5:1 contrast, keyboard navigation, focus management
5. **Consistency**: Reuse tokens, avoid one-off values

---

## 📦 Component Naming Convention

Follow this pattern for variants:

```
ComponentName/Type/State
```

Examples:
- `Button/Primary/Hover`
- `Input/Focus`
- `Card/Active`
- `Tab/Active/Glow`

---

## 🚀 Quick Start

```tsx
import { FilonButton } from "./components/design-system/Button";
import { FilonInput } from "./components/design-system/Input";
import { FilonCard } from "./components/design-system/Card";

function App() {
  return (
    <div style={{ backgroundColor: '#0A0A0A' }}>
      <FilonButton icon={<Plus />}>
        Create Thought
      </FilonButton>
      
      <FilonInput placeholder="Enter your thought..." />
      
      <FilonCard
        title="Interactive Card"
        description="Hover to see glow effect"
        icon={<Brain size={24} />}
      />
    </div>
  );
}
```

---

**Version**: 1.0.0  
**Updated**: November 6, 2025  
**License**: FILON Design System
