"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

type StepConfig = {
  id: string;
  target: string;
  title: string;
  body: string;
  placement: "top" | "bottom" | "left" | "right";
};

const STORAGE_KEY = "filon:ahaTourDone";
const TOOLTIP_WIDTH = 260;
const STEPS: StepConfig[] = [
  {
    id: "step-brainbar",
    target: "tour-brainbar",
    title: "Brainbar",
    body: "Type a thought and press Enter.",
    placement: "bottom",
  },
  {
    id: "step-mini-graph",
    target: "tour-minigraph",
    title: "Mini-Graph",
    body: "Preview of your latest five nodes.",
    placement: "right",
  },
  {
    id: "step-context",
    target: "tour-context",
    title: "Context Stream",
    body: "Notes with summaries. Use ↑ ↓ to navigate, Enter to open.",
    placement: "left",
  },
];

const isWorkspacePath = (pathname?: string | null) =>
  typeof pathname === "string" && pathname.startsWith("/f/");

export default function AhaTour() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const currentStep = useMemo(() => STEPS[stepIndex], [stepIndex]);

  const finishTour = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, "true");
      } catch (_error) {
        // Ignore storage failures
      }
    }
    setVisible(false);
    setAnchorRect(null);
  }, []);

  const advance = useCallback(() => {
    if (stepIndex + 1 >= STEPS.length) {
      finishTour();
      return;
    }
    setStepIndex((prev) => prev + 1);
  }, [finishTour, stepIndex]);

  const skip = useCallback(() => {
    finishTour();
  }, [finishTour]);

  useEffect(() => {
    if (!isWorkspacePath(pathname)) {
      setVisible(false);
      setAnchorRect(null);
      return;
    }
    if (typeof window === "undefined") return;
    try {
      const done = window.localStorage.getItem(STORAGE_KEY);
      if (done === "true") return;
    } catch (_error) {
      // Ignore storage errors
    }

    setStepIndex(0);
    const timer = window.setTimeout(() => setVisible(true), 600);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (!visible) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        skip();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [visible, skip]);

  useEffect(() => {
    if (!visible) return;
    let target: HTMLElement | null = null;
    let rafId: number | null = null;
    let retryTimer: number | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const updateRect = () => {
      if (!target) {
        setAnchorRect(null);
        return;
      }
      rafId = window.requestAnimationFrame(() => {
        setAnchorRect(target?.getBoundingClientRect() ?? null);
      });
    };

    const locateTarget = () => {
      target =
        (document.querySelector(
          `[data-tour-id="${currentStep.target}"]`
        ) as HTMLElement | null) ?? null;
      if (!target) {
        setAnchorRect(null);
        retryTimer = window.setTimeout(locateTarget, 200);
        return;
      }
      updateRect();
      window.addEventListener("resize", updateRect);
      window.addEventListener("scroll", updateRect, true);
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(updateRect);
        resizeObserver.observe(target);
      }
    };

    locateTarget();

    return () => {
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
      resizeObserver?.disconnect();
    };
  }, [visible, currentStep]);

  const tooltipPosition = useMemo(() => {
    if (!anchorRect) return null;
    let top = anchorRect.top;
    let left = anchorRect.left;

    switch (currentStep.placement) {
      case "bottom":
        top = anchorRect.bottom + 16;
        left = anchorRect.left + anchorRect.width / 2 - TOOLTIP_WIDTH / 2;
        break;
      case "top":
        top = anchorRect.top - 16;
        left = anchorRect.left + anchorRect.width / 2 - TOOLTIP_WIDTH / 2;
        break;
      case "right":
        top = anchorRect.top;
        left = anchorRect.right + 16;
        break;
      case "left":
        top = anchorRect.top;
        left = anchorRect.left - TOOLTIP_WIDTH - 16;
        break;
      default:
        break;
    }

    const viewportWidth = window.innerWidth;
    if (left + TOOLTIP_WIDTH > viewportWidth - 16) {
      left = viewportWidth - TOOLTIP_WIDTH - 16;
    }
    if (left < 16) {
      left = 16;
    }
    if (top + 160 > window.innerHeight - 16) {
      top = window.innerHeight - 176;
    }
    if (top < 16) {
      top = 16;
    }

    return { top, left };
  }, [anchorRect, currentStep]);

  if (!visible || !anchorRect || !tooltipPosition) {
    return null;
  }

  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
        className="pointer-events-none fixed z-[90] rounded-xl border border-cyan-300/60 bg-cyan-500/8"
        style={{
          top: anchorRect.top - 6,
          left: anchorRect.left - 6,
          width: anchorRect.width + 12,
          height: anchorRect.height + 12,
        }}
      />
      <motion.div
        role="dialog"
        aria-modal="false"
        aria-live="polite"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.12, ease: [0.25, 0.8, 0.4, 1] }}
        className="fixed z-[95] w-[260px] rounded-xl border border-cyan-500/20 bg-[#052029]/95 px-4 py-4 shadow-xl backdrop-blur-sm"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        <p className="text-sm font-normal text-cyan-50">{currentStep.title}</p>
        <p className="mt-2 text-sm font-light leading-snug text-cyan-100/80">
          {currentStep.body}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={skip}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80 transition hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#052029]"
          >
            Skip tour
          </button>
          <button
            type="button"
            onClick={advance}
            className="rounded-md bg-cyan-400/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#03141a] transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#052029]"
          >
            {stepIndex === STEPS.length - 1 ? "Finish" : "Next"}
          </button>
        </div>
      </motion.div>
    </>,
    document.body
  );
}

