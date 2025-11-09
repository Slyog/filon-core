import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch("http://localhost:4000", { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`QA viewer returned ${res.status}`);
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.warn(
      "[QA] Viewer offline or unreachable:",
      (err as Error).message
    );

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      total: 0,
      passed: 0,
      specs: [],
      message: "QA viewer unavailable — using fallback data",
    });
  }
}
