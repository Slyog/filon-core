import fs from "fs";
import path from "path";

const REPORTS_DIR = path.resolve("qa/reports");
const RESULTS_DIR = path.resolve("playwright-report");
const RESULT_FILE = path.join(RESULTS_DIR, "results.json");

fs.mkdirSync(REPORTS_DIR, { recursive: true });
fs.mkdirSync(RESULTS_DIR, { recursive: true });

if (!fs.existsSync(RESULT_FILE)) {
  console.error("No Playwright results found!");
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const reportPath = path.join(REPORTS_DIR, `report-${timestamp}.json`);

const data = JSON.parse(fs.readFileSync(RESULT_FILE, "utf-8"));
const meta = {
  commit: process.env.GITHUB_SHA || "local-dev",
  date: timestamp,
  total: data.stats?.tests ?? 0,
  passed: data.stats?.passed ?? 0,
  failed: data.stats?.failed ?? 0,
};

const payload = { meta, data };

fs.writeFileSync(reportPath, JSON.stringify(payload, null, 2));
fs.writeFileSync(path.join(REPORTS_DIR, "latest.json"), JSON.stringify(payload, null, 2));

console.log(`✅ QA report saved → ${reportPath}`);

