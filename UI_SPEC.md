# FILON v4 – UI Design System Specification

**Version:** 4.0  
**Last Updated:** 2024  
**Status:** Active Development

---

## Overview

FILON v4 uses a high-contrast dark theme with a cyan accent color system. The design emphasizes clarity, focus, and a minimal aesthetic optimized for deep work.

---

## Design Tokens

### Colors

All colors are defined as CSS custom properties and Tailwind tokens:

- **Background:** `filon-bg` (`#000000`)
- **Surface:** `filon-surface` (`#0c0c0c`)
- **Text:** `filon-text` (`#eaeaea`)
- **Accent:** `filon-accent` (`#2FF3FF`)
- **Border:** `filon-border` (`#1a1a1a`)

### Typography

- **Base font:** System font stack
- **Text sizes:** `text-xs`, `text-sm`, `text-base`
- **Text opacity variants:**
  - Primary: `text-filon-text` (100%)
  - Secondary: `text-filon-text/80` (80%)
  - Tertiary: `text-filon-text/60` (60%)
  - Muted: `text-filon-text/50` (50%)

### Spacing

- **Base unit:** 4px (0.25rem)
- **Common gaps:** `gap-2`, `gap-2.5`, `gap-3`, `gap-3.5`, `gap-4`

### Border Radius

- **Base radius:** `rounded-filon` (0.75rem / 12px)
- **Pill shape:** `rounded-full`
- **Card corners:** `rounded-filon` or `rounded-xl`

### Shadows & Glow

- **Glow:** `shadow-glow` (accent color with opacity)
- **Glow strong:** `shadow-glow-strong`
- **Surface:** `shadow-surface`
- **Raised:** `shadow-raised`

---

## Components

### Button

**Location:** `src/components/ui/button.tsx`

**Variants:**
- `primary`: Accent background, dark text
- `secondary`: Surface background with border
- `ghost`: Transparent with hover state

**Sizes:**
- `default`: `h-9 px-4 py-2`
- `sm`: `h-8 px-3 text-xs`
- `lg`: `h-10 px-8`

**Focus:** `focus-visible:ring-2 focus-visible:ring-filon-accent/80 focus-visible:ring-offset-2`

### Chip

**Location:** `src/components/ui/chip.tsx`

**Variants:**
- `default`: Subtle border and background
- `active`: Accent border and background with accent text
- `outline`: Transparent background with border

**Styling:** `rounded-full`, `px-3 py-1`, `text-xs`

### Input

**Base styling:**
- Background: `bg-filon-surface/70`
- Border: `border-filon-border/60`
- Focus: `focus-visible:ring-2 focus-visible:ring-filon-accent/40 focus-visible:border-filon-accent/60 focus-visible:shadow-glow`

---

## Layout Components

### Brainbar

**Location:** `src/components/layout/Brainbar.tsx`

**Structure:**
- Full-width pill input with trailing icon
- Helper text: "Press Enter to commit"
- Command chips below input

**Styling:**
- Input: `bg-filon-surface/70`, `rounded-filon`, `py-5 px-6`
- Helper text: `text-[10px]`, `uppercase`, `tracking-[0.16em]`, `text-filon-text/50`

### Sidebar

**Location:** `src/components/layout/Sidebar.tsx`

**Active item styling:**
- Left accent border: `border-l-2 border-l-filon-accent`
- Background: `bg-filon-surface/80`
- Text: `text-filon-text`

**Section headers:**
- `text-[11px]`, `uppercase`, `tracking-[0.3em]`, `text-filon-text/50`

### Context Stream Cards

**Location:** `src/components/layout/ContextStream.tsx`

**Default:**
- Background: `bg-filon-surface/70`
- Border: `border-filon-border/60`
- Radius: `rounded-filon`

**Hover:**
- Background: `bg-filon-surface/80`
- Border: `border-filon-accent/60`
- Left accent: `border-l-2 border-l-filon-accent`
- Glow: `shadow-glow`

**Card hierarchy:**
1. Label (uppercase, small)
2. Title (semibold)
3. Body (relaxed line-height)
4. Meta (timestamp, badges)

### Canvas

**Location:** `src/components/canvas/CanvasRoot.tsx`

**Background:**
- Base: `bg-[#050509]`
- Grid pattern: Subtle SVG pattern with low opacity
- Grid sits behind ReactFlow with `pointer-events-none`

---

## Interaction Patterns

### Hover States

- **Buttons:** Slight background/border opacity change
- **Cards:** Accent border, glow effect, background brightening
- **Navigation items:** Subtle background change

### Focus States

- **Visible rings:** `ring-2 ring-filon-accent/80`
- **Ring offset:** `ring-offset-2 ring-offset-filon-bg`
- **Always visible** for keyboard navigation

### Disabled States

- **Opacity:** `opacity-60`
- **Cursor:** `cursor-not-allowed`
- **No hover effects** when disabled

---

## Accessibility

- All interactive elements have visible focus indicators
- ARIA labels on form inputs and buttons
- Semantic HTML structure
- Keyboard navigation support throughout

---

## Notes

- All styling uses FILON design tokens (no hardcoded colors)
- Consistent use of `transition-all` for smooth interactions
- Backdrop blur used for sticky headers
- Grid background is non-interactive (`pointer-events-none`)

---

## Future Considerations

- [ ] Expand component documentation
- [ ] Add usage examples
- [ ] Document animation patterns
- [ ] Add color contrast ratios
- [ ] Document responsive breakpoints

