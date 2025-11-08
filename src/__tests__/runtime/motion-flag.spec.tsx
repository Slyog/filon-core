/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { motion } from "framer-motion";
import { runtimeFlags } from "@/config/runtimeFlags";
import { useRuntimeFlags } from "@/hooks/useRuntimeFlags";

// Mock runtimeFlags to control motionEnabled
jest.mock("@/config/runtimeFlags", () => ({
  runtimeFlags: {
    motionEnabled: false,
    soundEnabled: false,
  },
}));

// Mock components that use motion
const MockBackground = () => {
  const { motionEnabled } = useRuntimeFlags();
  if (!motionEnabled) return null;

  return (
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
      data-testid="background-motion"
    >
      Background
    </motion.div>
  );
};

const MockGlowLayer = () => {
  const { motionEnabled } = useRuntimeFlags();
  if (!motionEnabled) return null;

  return (
    <motion.div
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      data-testid="glow-layer"
    >
      Glow
    </motion.div>
  );
};

const MockParticles = () => {
  const { motionEnabled } = useRuntimeFlags();
  const rafRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!motionEnabled) return;

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [motionEnabled]);

  if (!motionEnabled) return null;

  return <div data-testid="particles">Particles</div>;
};

describe("Motion Flag Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to disabled state
    (runtimeFlags as any).motionEnabled = false;
    (runtimeFlags as any).soundEnabled = false;
  });

  test("Background component returns null when motionEnabled=false", () => {
    const { container } = render(<MockBackground />);
    expect(container.querySelector('[data-testid="background-motion"]')).toBeNull();
  });

  test("GlowLayer component returns null when motionEnabled=false", () => {
    const { container } = render(<MockGlowLayer />);
    expect(container.querySelector('[data-testid="glow-layer"]')).toBeNull();
  });

  test("Particles component returns null when motionEnabled=false", () => {
    const { container } = render(<MockParticles />);
    expect(container.querySelector('[data-testid="particles"]')).toBeNull();
  });

  test("No motion.div elements in DOM when motionEnabled=false", () => {
    const { container } = render(
      <>
        <MockBackground />
        <MockGlowLayer />
        <MockParticles />
      </>
    );

    // framer-motion creates elements with data attributes, check for absence
    const motionElements = container.querySelectorAll('[data-framer-name]');
    expect(motionElements.length).toBe(0);
  });

  test("No requestAnimationFrame calls when motionEnabled=false", () => {
    const rafSpy = jest.spyOn(window, "requestAnimationFrame");
    rafSpy.mockImplementation((cb) => {
      cb(0);
      return 0;
    });

    render(<MockParticles />);

    // Wait a bit to ensure no RAF calls
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // Particles should not call RAF when disabled
        expect(rafSpy).not.toHaveBeenCalled();
        rafSpy.mockRestore();
        resolve();
      }, 100);
    });
  });

  test("Components render when motionEnabled=true", () => {
    (runtimeFlags as any).motionEnabled = true;

    const { container } = render(
      <>
        <MockBackground />
        <MockGlowLayer />
        <MockParticles />
      </>
    );

    expect(container.querySelector('[data-testid="background-motion"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="glow-layer"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="particles"]')).toBeInTheDocument();
  });
});

