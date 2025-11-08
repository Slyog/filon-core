import fs from "fs";
import path from "path";

const REPORTS_DIR = path.resolve("qa/reports");

if (!fs.existsSync(REPORTS_DIR)) {
  console.error("No reports directory found. Run `npm run qa:report` first.");
  process.exit(1);
}

const files = fs
  .readdirSync(REPORTS_DIR)
  .filter((f) => f.endsWith(".json") && f !== "latest.json")
  .sort()
  .reverse();

const targetFile = files[0] ?? "latest.json";
const latestPath = path.join(REPORTS_DIR, targetFile);

if (!fs.existsSync(latestPath)) {
  console.error("No QA reports available to display.");
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(latestPath, "utf-8"));

console.log(`\n📊  FILON QA Report  (${report.meta?.date ?? "unknown"})`);
console.log(`Commit: ${report.meta?.commit ?? "unknown"}`);
console.log(
  `Passed: ${report.meta?.passed ?? 0} / ${report.meta?.total ?? 0}\n`
);
console.log("-----------------------------------------------------");

const suites = report.data?.suites ?? [];
if (suites.length === 0) {
  console.log("No suites found in report.");
  process.exit(0);
}

suites.forEach((suite) => {
  console.log(`📁 ${suite.title}`);
  suite.specs?.forEach((spec) => {
    const symbol = spec.ok ? "✅" : "❌";
    console.log(`  ${symbol} ${spec.title}`);
  });
});

console.log("");

