import fs from "fs";
import path from "path";

const REPORTS_DIR = path.resolve("qa/reports");

type TrendPoint = {
  date: string;
  passRate: number;
};

type QAInsights = {
  avg: number;
  volatility: number;
  trend: TrendPoint[];
};

function safeParseDate(dateInput: string | undefined): number | null {
  if (!dateInput) return null;
  // Accept ISO-like strings formatted with hyphen-separated time in filename.
  const normalized = dateInput.replace(
    /T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/,
    (_, hour, minute, second, ms) => `T${hour}:${minute}:${second}.${ms}Z`
  );
  const timestamp = Date.parse(normalized);
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function getQAInsights(): QAInsights {
  if (!fs.existsSync(REPORTS_DIR)) {
    return { avg: 0, volatility: 0, trend: [] };
  }

  const files = fs
    .readdirSync(REPORTS_DIR)
    .filter((file) => file.endsWith(".json") && file !== "latest.json");

  const reports: TrendPoint[] = files
    .map((file) => {
      try {
        const raw = fs.readFileSync(path.join(REPORTS_DIR, file), "utf-8");
        const data = JSON.parse(raw) as {
          meta?: { date?: string; passed?: number; total?: number };
        };
        const date = data.meta?.date ?? file.replace(".json", "");
        const total = data.meta?.total ?? 0;
        const passed = data.meta?.passed ?? 0;
        const passRate = total ? Math.round((passed / total) * 100) : 0;
        return { date, passRate };
      } catch (error) {
        console.warn(`[qa:insights] Failed to parse report ${file}`, error);
        return null;
      }
    })
    .filter((entry): entry is TrendPoint => entry !== null);

  const sorted = reports
    .map((entry) => ({
      ...entry,
      timestamp: safeParseDate(entry.date),
    }))
    .filter((entry) => entry.timestamp !== null)
    .sort((a, b) => (a.timestamp! < b.timestamp! ? -1 : 1))
    .slice(-30)
    .map(({ date, passRate }) => ({ date, passRate }));

  if (sorted.length === 0) {
    return { avg: 0, volatility: 0, trend: [] };
  }

  const totalPassRate = sorted.reduce((sum, entry) => sum + entry.passRate, 0);
  const avg = Math.round(totalPassRate / sorted.length);

  const passRates = sorted.map((entry) => entry.passRate);
  const volatility =
    passRates.length > 0
      ? Math.max(...passRates) - Math.min(...passRates)
      : 0;

  return {
    avg,
    volatility,
    trend: sorted,
  };
}

