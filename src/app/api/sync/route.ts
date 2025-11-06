import { NextRequest, NextResponse } from "next/server";
import { syncLambdaHandler } from "@/sync/syncLambdaHandler";
import type { SyncEvent } from "@/sync/syncSchema";

/**
 * API route for syncing graph changes
 * This runs server-side and calls the syncLambdaHandler
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Convert binary array back to Uint8Array
    // JSON.stringify converts Uint8Array to regular arrays, so we need to reconstruct it
    const syncEvent: SyncEvent = {
      ...body,
      change: body.change
        ? {
            ...body.change,
            binary: Array.isArray(body.change.binary)
              ? new Uint8Array(body.change.binary)
              : body.change.binary instanceof Uint8Array
              ? body.change.binary
              : new Uint8Array(body.change.binary || []),
          }
        : undefined,
    };

    // Extract token from Authorization header if present
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    // Call the server-side sync handler
    const response = await syncLambdaHandler(syncEvent, token);

    if (response.status === "ok") {
      return NextResponse.json(response, { status: 200 });
    } else {
      return NextResponse.json(response, { status: 400 });
    }
  } catch (error: any) {
    console.error("[API] Sync error:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
