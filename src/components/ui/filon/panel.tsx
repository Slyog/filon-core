"use client";

import * as React from "react";
import { motion, type HTMLMotionProps, AnimatePresence } from "framer-motion";

import { cn } from "./utils";
import { filonTokens } from "@/design/filonTokens";

// Motion variants for panel animations
const panelMotionVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const panelTransition = {
  duration: parseFloat(filonTokens.motion.duration.medium) / 1000,
  ease: filonTokens.motion.easing.smooth,
};

export interface FilonPanelProps extends HTMLMotionProps<"div"> {
  variant?: "default" | "floating" | "sidebar";
  size?: "sm" | "md" | "lg" | "xl";
  isOpen?: boolean;
  onClose?: () => void;
}

const sizeClasses = {
  sm: "w-64",
  md: "w-80",
  lg: "w-96",
  xl: "w-[28rem]",
};

const variantClasses = {
  default: "bg-surface-base border-r border-surface-active/50 hover:shadow-glow transition-all duration-300 ease-filon",
  floating:
    "bg-surface-base border border-brand/20 shadow-glow-md rounded-xl hover:shadow-glow transition-all duration-300 ease-filon",
  sidebar: "bg-surface-base border-r border-surface-active/50 h-full hover:shadow-glow transition-all duration-300 ease-filon",
};

function FilonPanel({
  className,
  variant = "default",
  size = "md",
  isOpen = true,
  onClose,
  children,
  ...props
}: FilonPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          data-slot="filon-panel"
          className={cn(
            "flex flex-col",
            sizeClasses[size],
            variantClasses[variant],
            className,
          )}
          variants={panelMotionVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={panelTransition}
          {...props}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PanelHeader({ className, ...props }: HTMLMotionProps<"div">) {
  return (
    <div
      data-slot="filon-panel-header"
      className={cn(
        "flex items-center justify-between px-6 py-4 border-b border-surface-active/50",
        className,
      )}
      {...props}
    />
  );
}

function PanelTitle({ className, ...props }: HTMLMotionProps<"h3">) {
  return (
    <h3
      data-slot="filon-panel-title"
      className={cn("text-lg font-semibold text-text-primary", className)}
      {...props}
    />
  );
}

function PanelContent({ className, ...props }: HTMLMotionProps<"div">) {
  return (
    <div
      data-slot="filon-panel-content"
      className={cn("flex-1 overflow-y-auto px-6 py-4", className)}
      {...props}
    />
  );
}

function PanelFooter({ className, ...props }: HTMLMotionProps<"div">) {
  return (
    <div
      data-slot="filon-panel-footer"
      className={cn(
        "flex items-center gap-2 px-6 py-4 border-t border-surface-active/50",
        className,
      )}
      {...props}
    />
  );
}

export { FilonPanel, PanelHeader, PanelTitle, PanelContent, PanelFooter };

