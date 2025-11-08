import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const REPORTS_DIR = path.join(process.cwd(), "qa", "reports");

type ReportMeta = {
  commit: string;
  date: string;
  total: number;
  passed: number;
  failed: number;
};

type ReportPayload = {
  file: string;
  meta: ReportMeta;
  data: Record<string, unknown>;
  status: "passed" | "failed";
  passRate: number;
};

export async function GET() {
  try {
    await fs.access(REPORTS_DIR);
  } catch {
    return NextResponse.json({ reports: [] });
  }

  const files = await fs.readdir(REPORTS_DIR);
  const reportFiles = files.filter(
    (file) => file.endsWith(".json") && file !== "latest.json"
  );

  const reports: ReportPayload[] = [];

  for (const file of reportFiles) {
    try {
      const raw = await fs.readFile(path.join(REPORTS_DIR, file), "utf-8");
      const parsed = JSON.parse(raw) as { meta?: ReportMeta; data?: unknown };
      const meta = parsed.meta ?? {
        commit: "unknown",
        date: file.replace("report-", "").replace(".json", ""),
        total: 0,
        passed: 0,
        failed: 0,
      };

      const status: "passed" | "failed" = meta.failed > 0 ? "failed" : "passed";
      const passRate =
        meta.total > 0 ? Math.round((meta.passed / meta.total) * 100) : 0;

      reports.push({
        file,
        meta,
        data: parsed.data ?? {},
        status,
        passRate,
      });
    } catch (error) {
      console.warn(`[qa:reports] Failed to parse report ${file}`, error);
    }
  }

  reports.sort((a, b) => {
    const aDate = a.meta.date ?? "";
    const bDate = b.meta.date ?? "";
    return aDate < bDate ? 1 : aDate > bDate ? -1 : 0;
  });

  return NextResponse.json({ reports });
}

