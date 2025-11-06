# FILON Design System Integration

This directory contains the Figma-to-Core design system synchronization.

## Structure

- `figmaTokens.json` - Extracted tokens from Figma design file
- `filonTokens.ts` - TypeScript mapping of Figma tokens to Tailwind CSS variables

## Token Synchronization

The `filonTokens.ts` file maps Figma design tokens to Tailwind CSS variables, which are then synchronized with `tailwind.config.ts`.

### Usage

```typescript
import { filonTokens } from "@/design/filonTokens";

// Access tokens
const primaryColor = filonTokens.colors.brand.DEFAULT;
const spacing = filonTokens.spacing.lg;
```

## Components

FILON components with Framer Motion integration are located in:
- `src/components/ui/filon/`

### Available Components

- `FilonButton` - Button with motion variants
- `Card` - Card component with hover animations
- `FilonPanel` - Panel with slide-in animations
- `FilonModal` - Modal with fade and scale animations

### Usage

```tsx
import { FilonButton, Card, FilonPanel, FilonModal } from "@/components/ui/filon";

<FilonButton variant="glow" size="lg">
  Click me
</FilonButton>
```

## Dependencies

The FILON components require the following packages (install if missing):

```bash
npm install @radix-ui/react-slot @radix-ui/react-dialog class-variance-authority clsx tailwind-merge
```

## Testing

Run the design system QA tests:

```bash
npm test -- qa-design-system.test.tsx
```

Tests cover:
- Token synchronization
- Component rendering
- Motion/animations
- Accessibility (jest-axe)
- Responsive layout
- Performance

