"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { XIcon } from "lucide-react";

import { cn } from "./utils";
import { filonTokens } from "@/design/filonTokens";

// Motion variants for modal animations
const overlayMotionVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const contentMotionVariants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 20 },
};

const modalTransition = {
  duration: parseFloat(filonTokens.motion.duration.medium) / 1000,
  ease: filonTokens.motion.easing.smooth,
};

function FilonModal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="filon-modal" {...props} />;
}

function FilonModalTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="filon-modal-trigger" {...props} />;
}

function FilonModalPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="filon-modal-portal" {...props} />;
}

function FilonModalClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="filon-modal-close" {...props} />;
}

function FilonModalOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="filon-modal-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
        className,
      )}
      asChild
      {...props}
    >
      <motion.div
        variants={overlayMotionVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={modalTransition}
      />
    </DialogPrimitive.Overlay>
  );
}

function FilonModalContent({
  className,
  children,
  size = "md",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  size?: "sm" | "md" | "lg" | "xl" | "fullscreen";
}) {
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    fullscreen: "max-w-[95vw] max-h-[95vh]",
  };

  return (
    <FilonModalPortal>
      <FilonModalOverlay />
      <DialogPrimitive.Content
        data-slot="filon-modal-content"
        className={cn(
          "fixed top-[50%] left-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 rounded-xl border border-brand/20 bg-surface-base p-6 shadow-glow-md hover:shadow-glow transition-all duration-300 ease-filon",
          sizeClasses[size],
          className,
        )}
        asChild
        {...props}
      >
        <motion.div
          variants={contentMotionVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={modalTransition}
        >
          {children}
          <DialogPrimitive.Close className="absolute top-4 right-4 rounded-lg opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface-base disabled:pointer-events-none">
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </motion.div>
      </DialogPrimitive.Content>
    </FilonModalPortal>
  );
}

function FilonModalHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="filon-modal-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function FilonModalFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="filon-modal-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function FilonModalTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="filon-modal-title"
      className={cn("text-lg font-semibold leading-none text-text-primary", className)}
      {...props}
    />
  );
}

function FilonModalDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="filon-modal-description"
      className={cn("text-sm text-text-secondary", className)}
      {...props}
    />
  );
}

export {
  FilonModal,
  FilonModalTrigger,
  FilonModalContent,
  FilonModalHeader,
  FilonModalFooter,
  FilonModalTitle,
  FilonModalDescription,
  FilonModalClose,
  FilonModalOverlay,
  FilonModalPortal,
};

