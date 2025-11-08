import fs from "fs";

const date = new Date().toISOString().split("T")[0];
const src = "playwright-report/index.html";
const dest = `qa/reports/${date}-canvas.html`;

fs.mkdirSync("qa/reports", { recursive: true });

if (!fs.existsSync(src)) {
  console.error(`❌ Source file not found: ${src}`);
  process.exit(1);
}

fs.copyFileSync(src, dest);

const historyFile = "qa/history.json";
const history = fs.existsSync(historyFile)
  ? JSON.parse(fs.readFileSync(historyFile, "utf-8"))
  : [];

history.push({
  date,
  report: dest,
  screenshot: "tests/__snapshots__/baseline-canvas.png",
});
history.push({
  date: new Date().toISOString(),
  event: "autosave",
  status: "manual",
  pending: false,
});
fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
console.log(`✅ QA report archived for ${date}`);

