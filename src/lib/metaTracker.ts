import fs from "fs";
import path from "path";

const META_PATH = path.resolve("public/qa/reports/meta.json");

export interface MetaRun {
  step: string;
  agent: string;
  agentType: string;
  duration_ms: number;
  retries: number;
  status: "pass" | "fail";
  intent?: string;
  timestamp: string;
}

export async function recordMetaRun(entry: Omit<MetaRun, "timestamp">) {
  const full: MetaRun = { ...entry, timestamp: new Date().toISOString() };
  let records: MetaRun[] = [];

  if (fs.existsSync(META_PATH)) {
    try {
      records = JSON.parse(fs.readFileSync(META_PATH, "utf8"));
      if (!Array.isArray(records)) {
        records = [];
      }
    } catch {
      records = [];
    }
  }

  records.push(full);
  fs.mkdirSync(path.dirname(META_PATH), { recursive: true });
  fs.writeFileSync(META_PATH, JSON.stringify(records, null, 2));
  console.info(`[FILON META] Logged step ${full.step} (${full.status})`);
}

