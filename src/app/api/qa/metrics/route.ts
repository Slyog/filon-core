import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const LATEST_REPORT = path.join(process.cwd(), "qa", "reports", "latest.json");

type LatestMeta = {
  date?: string;
  passed?: number;
  total?: number;
};

export async function GET() {
  try {
    const raw = await fs.readFile(LATEST_REPORT, "utf-8");
    const data = JSON.parse(raw) as { meta?: LatestMeta };
    const meta = data.meta ?? {};
    const passed = meta.passed ?? 0;
    const total = meta.total ?? 0;
    const passRate = total ? Math.round((passed / total) * 100) : 0;

    return NextResponse.json({
      date: meta.date ?? null,
      passed,
      total,
      passRate,
    });
  } catch (error) {
    console.error("[qa:metrics] failed to load latest report", error);
    return NextResponse.json(
      {
        date: null,
        passed: 0,
        total: 0,
        passRate: 0,
        error: "Latest QA report unavailable",
      },
      { status: 500 }
    );
  }
}

