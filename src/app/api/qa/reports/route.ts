import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const SUMMARY_PATH = path.join(
  process.cwd(),
  "tests",
  "__reports__",
  "qa-summary.json"
);

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
    const raw = await fs.readFile(SUMMARY_PATH, "utf-8");
    const summary = JSON.parse(raw) as {
      timestamp?: string;
      total?: number;
      passed?: number;
      failed?: number;
      specs?: string[];
    };

    const total = summary.total ?? 0;
    const passed = summary.passed ?? 0;
    const failed = summary.failed ?? 0;

    const report: ReportPayload = {
      file: "qa-summary.json",
      meta: {
        commit: "local-dev",
        date: summary.timestamp ?? new Date().toISOString(),
        total,
        passed,
        failed,
      },
      data: {
        suites: [
          {
            title: "Latest Run",
            specs: (summary.specs ?? []).map((spec) => ({
              title: spec,
              ok: true,
            })),
          },
        ],
      },
      status: failed > 0 ? "failed" : "passed",
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
    };

    return NextResponse.json({ reports: [report] });
  } catch {
    return NextResponse.json({ reports: [] });
  }
}

