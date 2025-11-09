import fs from "fs";
import path from "path";

const SUMMARY_PATH = path.resolve("tests/__reports__/qa-summary.json");

type TrendPoint = {
  date: string;
  passRate: number;
};

type QAInsights = {
  avg: number;
  volatility: number;
  trend: TrendPoint[];
};

export function getQAInsights(): QAInsights {
  if (!fs.existsSync(SUMMARY_PATH)) {
    return { avg: 0, volatility: 0, trend: [] };
  }

  try {
    const raw = fs.readFileSync(SUMMARY_PATH, "utf-8");
    const data = JSON.parse(raw) as {
      timestamp?: string;
      passed?: number;
      total?: number;
    };

    const date = data.timestamp ?? new Date().toISOString();
    const total = data.total ?? 0;
    const passed = data.passed ?? 0;
    const passRate = total ? Math.round((passed / total) * 100) : 0;

    return {
      avg: passRate,
      volatility: 0,
      trend: [{ date, passRate }],
    };
  } catch (error) {
    console.warn("[qa:insights] Failed to read summary", error);
    return { avg: 0, volatility: 0, trend: [] };
  }
}

