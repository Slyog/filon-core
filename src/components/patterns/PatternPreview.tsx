"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PatternPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

export function PatternPreview({
  title = "Pattern Preview",
  description,
  className,
  children,
  ...props
}: PatternPreviewProps) {
  return (
    <Card
      className={cn(
        "p-4 bg-filon-surface border-filon-border shadow-sm",
        className
      )}
      {...props}
    >
      {title && (
        <h3 className="text-sm font-semibold text-filon-text mb-2">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-xs text-filon-text/75 mb-4">{description}</p>
      )}
      <div className="flex items-center justify-center min-h-[120px]">
        {children || (
          <span className="text-xs text-filon-text/50">
            Pattern content will appear here
          </span>
        )}
      </div>
    </Card>
  );
}

