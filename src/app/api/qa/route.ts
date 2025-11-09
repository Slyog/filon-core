import { NextResponse } from "next/server";

const QA_VIEWER_URL =
  process.env.QA_VIEWER_URL ?? "http://localhost:4000";

export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(QA_VIEWER_URL, {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Viewer responded with ${response.status}`);
    }

    const summary = await response.json();
    return NextResponse.json(summary);
  } catch (error) {
    console.error("[api:qa] failed to load QA summary", error);
    return NextResponse.json(
      {
        error: "Failed to load QA summary",
      },
      { status: 503 }
    );
  } finally {
    clearTimeout(timeout);
  }
}


