"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

import { cn } from "./utils";
import { filonTokens } from "@/design/filonTokens";

// Motion variants for card interactions
const cardMotionVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  hover: { y: -2 },
};

const cardTransition = {
  duration: parseFloat(filonTokens.motion.duration.medium) / 1000,
  ease: filonTokens.motion.easing.smooth,
};

function Card({
  className,
  ...props
}: HTMLMotionProps<"div"> & {
  variant?: "default" | "elevated" | "outlined";
}) {
  return (
    <motion.div
      data-slot="filon-card"
      className={cn(
        "bg-surface-base text-text-primary flex flex-col gap-6 rounded-xl border border-surface-active/50",
        "hover:border-brand/30 hover:shadow-glow transition-all duration-300 ease-filon",
        className,
      )}
      variants={cardMotionVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      transition={cardTransition}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: HTMLMotionProps<"div">) {
  return (
    <div
      data-slot="filon-card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 pt-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: HTMLMotionProps<"h4">) {
  return (
    <h4
      data-slot="filon-card-title"
      className={cn("text-lg font-semibold leading-none text-text-primary", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: HTMLMotionProps<"p">) {
  return (
    <p
      data-slot="filon-card-description"
      className={cn("text-sm text-text-secondary", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: HTMLMotionProps<"div">) {
  return (
    <div
      data-slot="filon-card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: HTMLMotionProps<"div">) {
  return (
    <div
      data-slot="filon-card-content"
      className={cn("px-6 [&:last-child]:pb-6", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: HTMLMotionProps<"div">) {
  return (
    <div
      data-slot="filon-card-footer"
      className={cn("flex items-center px-6 pb-6 [.border-t]:pt-6", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};

