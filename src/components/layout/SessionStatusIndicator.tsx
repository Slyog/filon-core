"use client";

import { useCallback } from "react";
import { Loader2, Check, AlertCircle, Circle } from "lucide-react";
import { useSessionStatus } from "@/hooks/useSessionStatus";
import { cn } from "@/lib/utils";

export function SessionStatusIndicator() {
  const { status, hasPendingChanges, saveNow, error } = useSessionStatus();

  const handleClick = useCallback(() => {
    if (status === "error" || (hasPendingChanges && status !== "saving")) {
      saveNow();
    }
  }, [status, hasPendingChanges, saveNow]);

  const getStatusConfig = () => {
    if (status === "saving") {
      return {
        icon: Loader2,
        label: "Saving…",
        className: "text-filon-accent/80",
        iconClassName: "animate-spin",
      };
    }

    if (status === "error") {
      return {
        icon: AlertCircle,
        label: "Save failed",
        className: "text-red-400/90 hover:text-red-300 cursor-pointer",
        iconClassName: "",
        tooltip: error || "Click to retry",
      };
    }

    if (hasPendingChanges) {
      return {
        icon: Circle,
        label: "Unsaved changes",
        className: "text-amber-400/90 hover:text-amber-300 cursor-pointer",
        iconClassName: "",
      };
    }

    // !hasPendingChanges && status === "saved"
    return {
      icon: Check,
      label: "Saved",
      className: "text-filon-text/60",
      iconClassName: "",
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <button
      onClick={handleClick}
      disabled={status === "saving" || status === "saved"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        "bg-filon-surface/60 border border-filon-border/40",
        "transition-colors duration-150 ease-out",
        "disabled:cursor-default",
        config.className,
        (status === "error" || (hasPendingChanges && status !== "saving")) &&
          "hover:bg-filon-surface/80 hover:border-filon-border/60"
      )}
      aria-label={config.tooltip || config.label}
      title={config.tooltip || config.label}
      data-testid="session-status-indicator"
    >
      <Icon
        className={cn("h-3 w-3", config.iconClassName)}
        aria-hidden="true"
      />
      <span>{config.label}</span>
    </button>
  );
}

