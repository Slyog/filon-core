import { db } from '@/store/db';
import type { TelemetryLog } from '@/store/db';

type TelemetryType = TelemetryLog['type'];

export async function logTelemetry(
  type: TelemetryType,
  message: string,
  detail: any = {},
  sessionId?: string
): Promise<void> {
  try {
    const entry: TelemetryLog = {
      type,
      message,
      detail,
      sessionId,
      timestamp: Date.now(),
    };
    
    await db.telemetry.add(entry);
    
    // Maintain rolling limit of 50 entries
    const count = await db.telemetry.count();
    if (count > 50) {
      const old = await db.telemetry
        .orderBy('timestamp')
        .limit(count - 50)
        .toArray();
      
      await Promise.all(old.map((o) => db.telemetry.delete(o.id!)));
    }
  } catch (err) {
    // Silently fail telemetry logging to avoid breaking the app
    console.warn('[TELEMETRY] Failed to log event:', err);
  }
}

export async function getRecentTelemetry(limit: number = 20): Promise<TelemetryLog[]> {
  try {
    return await db.telemetry
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray();
  } catch (err) {
    console.warn('[TELEMETRY] Failed to get recent logs:', err);
    return [];
  }
}
