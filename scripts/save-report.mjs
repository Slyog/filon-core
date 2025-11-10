import fs from "fs";
import path from "path";

const REPORT_DIR = path.resolve("tests/__reports__");
const SUMMARY_PATH = path.join(REPORT_DIR, "qa-summary.json");
const META_PATH = path.resolve("public/qa/reports/meta.json");

if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

const args = process.argv.slice(2);
const options = {};

for (const arg of args) {
  if (arg.startsWith("--mode=")) {
    options.mode = arg.split("=")[1];
  } else if (arg.startsWith("--status=")) {
    options.status = arg.split("=")[1];
  } else if (arg.startsWith("--stack=")) {
    const encoded = arg.slice("--stack=".length);
    try {
      options.stack = decodeURIComponent(encoded);
    } catch {
      options.stack = encoded;
    }
  }
}

const now = new Date().toISOString();
const mode = options.mode ?? process.env.FILON_QA_MODE ?? null;
const summaryPath = mode
  ? path.join(REPORT_DIR, `qa-summary-${mode}.json`)
  : SUMMARY_PATH;

let runStatus = options.status ?? "pass";

const exitCodeEnv =
  process.env.QA_LAST_EXIT_CODE ??
  process.env.LAST_EXIT_CODE ??
  process.env.npm_config_exit_code;

if (exitCodeEnv && Number(exitCodeEnv) !== 0) {
  runStatus = "fail";
}

if (process.env.QA_ERROR_STACK) {
  options.stack = process.env.QA_ERROR_STACK;
}

const passRate = runStatus === "fail" ? 0 : 100;

const summary = {
  timestamp: now,
  mode: mode ?? "default",
  status: runStatus,
  total: 1,
  passed: runStatus === "fail" ? 0 : 1,
  failed: runStatus === "fail" ? 1 : 0,
  passRate,
  error: options.stack ?? null,
};

fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
console.log("✅ QA summary written:", summaryPath);

const metaDir = path.dirname(META_PATH);
if (!fs.existsSync(metaDir)) {
  fs.mkdirSync(metaDir, { recursive: true });
}

let meta = { history: [] };
if (fs.existsSync(META_PATH)) {
  try {
    const content = fs.readFileSync(META_PATH, "utf8");
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      meta.history = parsed;
    } else if (parsed && typeof parsed === "object") {
      meta = { history: [], ...parsed };
      if (Array.isArray(parsed.history)) {
        meta.history = parsed.history;
      }
    }
  } catch (error) {
    console.warn(
      "⚠️ Could not parse existing QA meta.json, starting fresh:",
      error
    );
  }
}

meta.history = meta.history ?? [];

if (mode) {
  meta.history.push({
    step: `35.11-run-${mode}`,
    mode,
    status: runStatus,
    passRate,
    timestamp: now,
    agent: "Cursor",
  });
} else {
  const resilienceModes = ["mock", "real", "mixed"];
  const runs = resilienceModes.map((resMode) => {
    try {
      const reportPath = path.join(
        REPORT_DIR,
        `qa-summary-${resMode}.json`
      );
      const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
      return {
        mode: resMode,
        passRate: Number(report.passRate) || 0,
      };
    } catch {
      return { mode: resMode, passRate: 0 };
    }
  });

  const averagePassRate =
    runs.reduce((acc, item) => acc + item.passRate, 0) / runs.length;

  meta.resilienceSweep = {
    timestamp: now,
    runs,
    averagePassRate,
  };

  meta.history.push({
    step: "35.11-ResilienceQASweep",
    agent: "Cursor",
    timestamp: now,
    averagePassRate,
    status: averagePassRate >= 80 ? "stable" : "needs-optimization",
  });
}

fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2));
console.log("✅ FILON QA meta.json updated:", META_PATH);
