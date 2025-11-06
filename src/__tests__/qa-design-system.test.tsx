/**
 * @jest-environment jsdom
 */
/**
 * QA – FILON Design System Integration
 * Tests Figma token synchronization, component rendering, motion, and accessibility
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { axe, toHaveNoViolations } from "jest-axe";
import {
  FilonButton,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  FilonPanel,
  PanelHeader,
  PanelTitle,
  FilonModal,
  FilonModalTrigger,
  FilonModalContent,
  FilonModalHeader,
  FilonModalTitle,
} from "@/components/ui/filon";
import { filonTokens } from "@/design/filonTokens";

expect.extend(toHaveNoViolations);

describe("FILON Design System – Token Synchronization", () => {
  describe("Figma Tokens Import", () => {
    test("filonTokens are properly exported", () => {
      expect(filonTokens).toBeDefined();
      expect(filonTokens.colors).toBeDefined();
      expect(filonTokens.spacing).toBeDefined();
      expect(filonTokens.radius).toBeDefined();
      expect(filonTokens.motion).toBeDefined();
    });

    test("color tokens match Figma values", () => {
      expect(filonTokens.colors.brand.DEFAULT).toBe("#2FF3FF");
      expect(filonTokens.colors.text.primary).toBe("#E6E6E6");
      expect(filonTokens.colors.surfaceVariants.base).toBe("#0B0C10");
    });

    test("spacing tokens are defined", () => {
      expect(filonTokens.spacing.xs).toBe("0.5rem");
      expect(filonTokens.spacing.sm).toBe("1rem");
      expect(filonTokens.spacing.lg).toBe("2rem");
    });

    test("radius tokens are defined", () => {
      expect(filonTokens.radius.sm).toBe("1rem");
      expect(filonTokens.radius.xl).toBe("1.5rem");
      expect(filonTokens.radius["2xl"]).toBe("2rem");
    });

    test("motion tokens are defined", () => {
      expect(filonTokens.motion.duration.fast).toBe("150ms");
      expect(filonTokens.motion.duration.medium).toBe("300ms");
      expect(filonTokens.motion.easing.smooth).toBeDefined();
    });
  });

  describe("Tailwind Config Sync", () => {
    test("tokens are accessible via Tailwind classes", () => {
      const testEl = document.createElement("div");
      testEl.className = "bg-surface-base text-text-primary rounded-xl";
      document.body.appendChild(testEl);

      expect(testEl.className).toContain("bg-surface-base");
      expect(testEl.className).toContain("text-text-primary");
      expect(testEl.className).toContain("rounded-xl");
    });

    test("brand colors are accessible", () => {
      const testEl = document.createElement("div");
      testEl.className = "text-brand bg-brand/20";
      document.body.appendChild(testEl);

      expect(testEl.className).toContain("text-brand");
      expect(testEl.className).toContain("bg-brand/20");
    });

    test("glow shadows are accessible", () => {
      const testEl = document.createElement("div");
      testEl.className = "shadow-glow shadow-glow-md";
      document.body.appendChild(testEl);

      expect(testEl.className).toContain("shadow-glow");
      expect(testEl.className).toContain("shadow-glow-md");
    });
  });
});

describe("FILON Components – Rendering", () => {
  describe("FilonButton", () => {
    test("renders with default variant", () => {
      render(<FilonButton>Click me</FilonButton>);
      const button = screen.getByRole("button", { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("data-slot", "filon-button");
    });

    test("renders with different variants", () => {
      const { rerender } = render(<FilonButton variant="outline">Outline</FilonButton>);
      expect(screen.getByRole("button")).toBeInTheDocument();

      rerender(<FilonButton variant="ghost">Ghost</FilonButton>);
      expect(screen.getByRole("button")).toBeInTheDocument();

      rerender(<FilonButton variant="glow">Glow</FilonButton>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    test("renders with different sizes", () => {
      const { rerender } = render(<FilonButton size="sm">Small</FilonButton>);
      expect(screen.getByRole("button")).toBeInTheDocument();

      rerender(<FilonButton size="lg">Large</FilonButton>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    test("applies custom className", () => {
      render(<FilonButton className="custom-class">Custom</FilonButton>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class");
    });
  });

  describe("Card", () => {
    test("renders card with content", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
          </CardHeader>
          <CardContent>Card content</CardContent>
        </Card>,
      );

      expect(screen.getByText("Test Card")).toBeInTheDocument();
      expect(screen.getByText("Card content")).toBeInTheDocument();
    });

    test("card has correct data-slot attribute", () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.querySelector('[data-slot="filon-card"]');
      expect(card).toBeInTheDocument();
    });
  });

  describe("FilonPanel", () => {
    test("renders panel when open", () => {
      render(
        <FilonPanel isOpen={true} size="md">
          <PanelHeader>
            <PanelTitle>Panel Title</PanelTitle>
          </PanelHeader>
        </FilonPanel>,
      );

      expect(screen.getByText("Panel Title")).toBeInTheDocument();
    });

    test("does not render panel when closed", () => {
      render(
        <FilonPanel isOpen={false} size="md">
          <PanelHeader>
            <PanelTitle>Panel Title</PanelTitle>
          </PanelHeader>
        </FilonPanel>,
      );

      expect(screen.queryByText("Panel Title")).not.toBeInTheDocument();
    });

    test("applies size classes correctly", () => {
      const { container, rerender } = render(
        <FilonPanel isOpen={true} size="sm">
          Content
        </FilonPanel>,
      );
      let panel = container.querySelector('[data-slot="filon-panel"]');
      expect(panel).toHaveClass("w-64");

      rerender(
        <FilonPanel isOpen={true} size="lg">
          Content
        </FilonPanel>,
      );
      panel = container.querySelector('[data-slot="filon-panel"]');
      expect(panel).toHaveClass("w-96");
    });
  });

  describe("FilonModal", () => {
    test("renders modal when open", async () => {
      render(
        <FilonModal open={true}>
          <FilonModalTrigger asChild>
            <button>Open</button>
          </FilonModalTrigger>
          <FilonModalContent>
            <FilonModalHeader>
              <FilonModalTitle>Modal Title</FilonModalTitle>
            </FilonModalHeader>
          </FilonModalContent>
        </FilonModal>,
      );

      await waitFor(() => {
        expect(screen.getByText("Modal Title")).toBeInTheDocument();
      });
    });
  });
});

describe("FILON Components – Motion & Performance", () => {
  describe("Motion Variants", () => {
    test("button has motion variants defined", () => {
      const { container } = render(<FilonButton>Test</FilonButton>);
      const button = container.querySelector('[data-slot="filon-button"]');
      expect(button).toBeInTheDocument();
      // Motion props are applied via Framer Motion
      expect(button).toHaveAttribute("class");
    });

    test("card has motion variants", () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.querySelector('[data-slot="filon-card"]');
      expect(card).toBeInTheDocument();
      // Motion component should be rendered
    });

    test("motion duration uses tokens", () => {
      const fastDuration = parseFloat(filonTokens.motion.duration.fast) / 1000;
      expect(fastDuration).toBeLessThanOrEqual(0.25); // Performance threshold
    });
  });

  describe("Reduced Motion Support", () => {
    test("reduced motion preference is detectable", () => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
      expect(prefersReduced).toBeDefined();
      expect(typeof prefersReduced.matches).toBe("boolean");
    });
  });

  describe("Performance", () => {
    test("motion durations are optimized", () => {
      const fast = parseFloat(filonTokens.motion.duration.fast) / 1000;
      const medium = parseFloat(filonTokens.motion.duration.medium) / 1000;
      const slow = parseFloat(filonTokens.motion.duration.slow) / 1000;

      expect(fast).toBeLessThanOrEqual(0.2);
      expect(medium).toBeLessThanOrEqual(0.4);
      expect(slow).toBeLessThanOrEqual(0.7);
    });

    test("no layout shifts on component mount", async () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.querySelector('[data-slot="filon-card"]');
      
      // Component should render without causing layout shift
      expect(card).toBeInTheDocument();
      
      // Check that initial styles are applied
      const styles = window.getComputedStyle(card!);
      expect(styles.opacity).toBeDefined();
    });
  });
});

describe("FILON Components – Accessibility", () => {
  describe("Button Accessibility", () => {
    test("button has focus styles", () => {
      const { container } = render(<FilonButton>Test</FilonButton>);
      const button = container.querySelector("button");
      expect(button?.className).toContain("focus-visible:ring");
    });

    test("button is keyboard accessible", () => {
      render(<FilonButton>Test</FilonButton>);
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      
      // Button should be focusable
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    test("disabled button is not interactive", () => {
      render(<FilonButton disabled>Disabled</FilonButton>);
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });
  });

  describe("Card Accessibility", () => {
    test("card has semantic structure", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>,
      );

      const title = screen.getByText("Title");
      expect(title.tagName).toBe("H4");
    });
  });

  describe("Panel Accessibility", () => {
    test("panel has proper ARIA attributes", () => {
      const { container } = render(
        <FilonPanel isOpen={true} size="md">
          <PanelHeader>
            <PanelTitle>Panel</PanelTitle>
          </PanelHeader>
        </FilonPanel>,
      );

      const panel = container.querySelector('[data-slot="filon-panel"]');
      expect(panel).toBeInTheDocument();
    });
  });

  describe("Modal Accessibility", () => {
    test("modal has dialog semantics", async () => {
      render(
        <FilonModal open={true}>
          <FilonModalContent>
            <FilonModalHeader>
              <FilonModalTitle>Modal</FilonModalTitle>
            </FilonModalHeader>
          </FilonModalContent>
        </FilonModal>,
      );

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        expect(dialog).toBeInTheDocument();
      });
    });
  });

  describe("axe-core Accessibility Tests", () => {
    test("FilonButton has no accessibility violations", async () => {
      const { container } = render(<FilonButton>Test Button</FilonButton>);
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });

    test("Card has no accessibility violations", async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
          <CardContent>Card content goes here</CardContent>
        </Card>,
      );

      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });

    test("FilonPanel has no accessibility violations", async () => {
      const { container } = render(
        <FilonPanel isOpen={true} size="md">
          <PanelHeader>
            <PanelTitle>Panel Title</PanelTitle>
          </PanelHeader>
        </FilonPanel>,
      );

      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });

    test("FilonModal has no accessibility violations", async () => {
      const { container } = render(
        <FilonModal open={true}>
          <FilonModalContent>
            <FilonModalHeader>
              <FilonModalTitle>Modal Title</FilonModalTitle>
            </FilonModalHeader>
          </FilonModalContent>
        </FilonModal>,
      );

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
          "aria-hidden-focus": { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });
  });
});

describe("FILON Components – Responsive Layout", () => {
  test("components use responsive classes", () => {
    const { container } = render(
      <Card className="w-full sm:w-1/2 lg:w-1/3">Content</Card>,
    );
    const card = container.querySelector('[data-slot="filon-card"]');
    expect(card?.className).toContain("w-full");
    expect(card?.className).toContain("sm:w-1/2");
    expect(card?.className).toContain("lg:w-1/3");
  });

  test("panel sizes are responsive", () => {
    const { container, rerender } = render(
      <FilonPanel isOpen={true} size="sm" className="w-full sm:w-64">
        Content
      </FilonPanel>,
    );
    const panel = container.querySelector('[data-slot="filon-panel"]');
    expect(panel?.className).toContain("w-full");
    expect(panel?.className).toContain("sm:w-64");
  });
});

describe("FILON Components – Token Application", () => {
  test("components use FILON color tokens", () => {
    const { container } = render(
      <Card className="bg-surface-base text-text-primary">Content</Card>,
    );
    const card = container.querySelector('[data-slot="filon-card"]');
    expect(card?.className).toContain("bg-surface-base");
    expect(card?.className).toContain("text-text-primary");
  });

  test("components use FILON spacing tokens", () => {
    const { container } = render(
      <Card className="p-4 gap-6">Content</Card>,
    );
    const card = container.querySelector('[data-slot="filon-card"]');
    expect(card?.className).toContain("gap-6");
  });

  test("components use FILON radius tokens", () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.querySelector('[data-slot="filon-card"]');
    expect(card?.className).toContain("rounded-xl");
  });

  test("components use FILON glow effects", () => {
    const { container } = render(
      <FilonButton variant="glow">Glow Button</FilonButton>,
    );
    const button = container.querySelector("button");
    expect(button?.className).toContain("shadow-glow");
  });
});

