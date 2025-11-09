import fs from "fs";
import path from "path";

const SUMMARY_PATH = path.resolve("tests/__reports__/qa-summary.json");

export type QASummary = {
  timestamp?: string;
  total?: number;
  passed?: number;
  failed?: number;
  specs?: string[];
};

const EMPTY_SUMMARY: QASummary = {
  specs: [],
  total: 0,
  passed: 0,
  failed: 0,
};

function sanitizeSummary(data: unknown): QASummary {
  if (!data || typeof data !== "object") {
    return { ...EMPTY_SUMMARY };
  }

  const raw = data as Record<string, unknown>;
  const summary: QASummary = {};

  if (typeof raw.timestamp === "string") {
    summary.timestamp = raw.timestamp;
  }

  if (typeof raw.total === "number" && Number.isFinite(raw.total)) {
    summary.total = raw.total;
  }

  if (typeof raw.passed === "number" && Number.isFinite(raw.passed)) {
    summary.passed = raw.passed;
  }

  if (typeof raw.failed === "number" && Number.isFinite(raw.failed)) {
    summary.failed = raw.failed;
  }

  if (Array.isArray(raw.specs)) {
    summary.specs = raw.specs.filter((spec): spec is string => typeof spec === "string");
  }

  return {
    ...EMPTY_SUMMARY,
    ...summary,
  };
}

export function getQASummary(): QASummary {
  if (!fs.existsSync(SUMMARY_PATH)) {
    return { ...EMPTY_SUMMARY };
  }

  try {
    const raw = fs.readFileSync(SUMMARY_PATH, "utf-8");
    const data = JSON.parse(raw) as unknown;
    return sanitizeSummary(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code !== "ENOENT") {
      console.warn("[qa:summary] Failed to read summary file", error);
    }
    return { ...EMPTY_SUMMARY };
  }
}


