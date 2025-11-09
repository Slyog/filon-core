"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";
import { filonTokens } from "@/design/filonTokens";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 ease-filon disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base",
  {
    variants: {
      variant: {
        default:
          "bg-brand text-surface-base hover:bg-brand/90 shadow-glow hover:shadow-glow",
        destructive:
          "bg-accent-error text-white hover:bg-accent-error/90 focus-visible:ring-accent-error",
        outline:
          "border border-brand/30 bg-surface-base text-text-primary hover:bg-surface-hover hover:border-brand/50",
        secondary:
          "bg-surface-active text-text-primary hover:bg-surface-hover",
        ghost:
          "hover:bg-surface-hover hover:text-text-primary",
        link: "text-brand underline-offset-4 hover:underline hover:text-accent-glow",
        glow: "bg-brand text-surface-base hover:bg-accent-glow shadow-glow-md hover:shadow-glow",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-lg gap-1.5 px-3 has-[>svg]:px-2.5 text-xs",
        lg: "h-10 rounded-xl px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

// Motion variants for button interactions
const buttonMotionVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
};

export interface FilonButtonProps
  extends HTMLMotionProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const FilonButtonBase = React.forwardRef<HTMLButtonElement, FilonButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const motionProps = {
      variants: buttonMotionVariants,
      initial: "initial" as const,
      whileHover: "hover" as const,
      whileTap: "tap" as const,
      transition: {
        duration: parseFloat(filonTokens.motion.duration.fast) / 1000,
        ease: filonTokens.motion.easing.smooth,
      },
    };

    if (asChild) {
      // Filter out motion-specific props for Slot
      const { variants, initial, whileHover, whileTap, transition, ...slotProps } = props as any;
      return (
        <Slot
          ref={ref}
          data-slot="filon-button"
          className={cn(buttonVariants({ variant, size, className }))}
          {...slotProps}
        />
      );
    }

    return (
      <motion.button
        ref={ref}
        data-slot="filon-button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...motionProps}
        {...props}
      />
    );
  },
);

FilonButtonBase.displayName = "FilonButton";

export const FilonButton = FilonButtonBase;
export { buttonVariants };

