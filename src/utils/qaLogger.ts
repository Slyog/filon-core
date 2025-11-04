import { getQAState, type QAEntry } from "@/store/QAStore";

export function logQA(params: {
  step?: string;
  status: "success" | "error" | "info";
  notes?: string;
  meta?: Record<string, any>;
  timestamp?: number;
}): void {
  try {
    const entry = getQAState().addEntry({
      step: params.step,
      status: params.status,
      notes: params.notes,
      meta: params.meta,
      timestamp: params.timestamp,
    });

    // Dispatch custom event
    if (typeof window !== "undefined") {
      const event = new CustomEvent<QAEntry>("filon:qa", { detail: entry });
      window.dispatchEvent(event);
    }

    // Console debug
    const stepLabel = params.step ? `<${params.step}>` : "";
    const notesLabel = params.notes ? ` - ${params.notes}` : "";
    console.debug(`[QA] ${params.status.toUpperCase()} ${stepLabel}${notesLabel}`);
  } catch (err) {
    // Non-blocking: never throw
    console.warn("[QA] Logger error:", err);
  }
}

export const logSuccess = (params: {
  step?: string;
  notes?: string;
  meta?: Record<string, any>;
  timestamp?: number;
}) => logQA({ ...params, status: "success" });

export const logError = (params: {
  step?: string;
  notes?: string;
  meta?: Record<string, any>;
  timestamp?: number;
}) => logQA({ ...params, status: "error" });

export const logInfo = (params: {
  step?: string;
  notes?: string;
  meta?: Record<string, any>;
  timestamp?: number;
}) => logQA({ ...params, status: "info" });
