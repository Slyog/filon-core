import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const chipVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-filon-accent/60 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        default:
          "border-filon-border/70 bg-filon-surface/60 text-filon-text/75 hover:border-filon-accent/50 hover:bg-filon-surface/80 hover:text-filon-text",
        active:
          "border-filon-accent/70 bg-filon-surface/90 text-filon-accent",
        outline:
          "border-filon-border/60 bg-transparent text-filon-text/75 hover:border-filon-accent/50 hover:bg-filon-surface/40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface ChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof chipVariants> {}

const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <button
        type="button"
        className={cn(chipVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Chip.displayName = "Chip";

export { Chip, chipVariants };

