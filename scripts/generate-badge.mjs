import fs from "fs";
import path from "path";

const REPORT = path.resolve("qa/reports/latest.json");
const OUT_DIR = path.resolve("qa/badges");

fs.mkdirSync(OUT_DIR, { recursive: true });

if (!fs.existsSync(REPORT)) {
  console.error("No latest QA report found. Run `npm run qa:report` first.");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(REPORT, "utf-8"));
const { passed = 0, total = 0 } = data.meta ?? {};

const passRate = total ? Math.round((passed / total) * 100) : 0;

const color =
  passRate === 100 ? "#2FF3FF" : passRate > 80 ? "#00BFA6" : "#EAB308";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="110" height="20">
  <rect width="110" height="20" rx="4" fill="#1B1B1B"/>
  <text x="8" y="14" font-family="sans-serif" font-size="11" fill="#EEE">QA Pass</text>
  <rect x="60" width="50" height="20" rx="4" fill="${color}"/>
  <text x="85" y="14" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#000">${passRate}%</text>
</svg>`;

const badgePath = path.join(OUT_DIR, "qa-badge.svg");
fs.writeFileSync(badgePath, svg);
console.log(`✅ QA Badge generated → ${badgePath}`);

