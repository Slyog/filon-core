import fs from "fs";
import path from "path";

const META_PATH = path.join(process.cwd(), "qa/reports/meta.json");
const DASHBOARD_PATH = path.join(process.cwd(), "src/app/qa/page.tsx");
const BACKUP_PATH = path.join(process.cwd(), "qa/reports/dashboard.html.bak");

const log = (msg) => console.log(`[DASHBOARD] ${msg}`);

try {
  if (!fs.existsSync(META_PATH)) throw new Error("meta.json not found");
  const meta = JSON.parse(fs.readFileSync(META_PATH, "utf8"));
  const passRate = Math.round(meta.passRate ?? 0);
  const status = meta.status || "unknown";
  const color = status === "failed" ? "text-red-500" : "text-green-400";
  const badgeText =
    status === "failed"
      ? `⚠️ ${passRate}% Pass Rate`
      : `✅ ${passRate}% Pass Rate`;

  log(`Loaded pass rate: ${passRate}% (${status})`);

  if (!fs.existsSync(DASHBOARD_PATH))
    throw new Error("Dashboard TSX file not found");

  const source = fs.readFileSync(DASHBOARD_PATH, "utf8");
  fs.writeFileSync(BACKUP_PATH, source);

  const updated = source.replace(
    /(\d+% Pass Rate.*?<\/span>)/,
    `${badgeText}</span>`
  );

  fs.writeFileSync(DASHBOARD_PATH, updated);
  log(`Badge updated → ${badgeText} (${color})`);
} catch (err) {
  log(`⚠️  Failed to update dashboard: ${err.message}`);
  process.exit(1);
}

