import { NextResponse } from "next/server";
import { getQAInsights } from "@/lib/qa/insights";

export async function GET() {
  const insights = getQAInsights();
  return NextResponse.json(insights);
}

