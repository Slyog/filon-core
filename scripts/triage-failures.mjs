import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const LATEST_PATH = path.join(ROOT, "qa/reports/latest.json");
const FAILURES_PATH = path.join(ROOT, "qa/reports/failures.json");
const TRIAGE_SUMMARY_PATH = path.join(
  ROOT,
  "qa/reports/triage-summary.json"
);
const META_PATH = path.join(ROOT, "qa/reports/meta.json");

const log = (msg) => console.log(`[TRIAGE] ${msg}`);

function loadLatestReport() {
  if (!fs.existsSync(LATEST_PATH)) {
    throw new Error(`Missing latest report at ${LATEST_PATH}`);
  }
  return JSON.parse(fs.readFileSync(LATEST_PATH, "utf8"));
}

function extractFailures(report) {
  const failures = [];

  function traverseSuite(suite, inheritedFile) {
    if (!suite || typeof suite !== "object") return;
    const suiteFile = suite.file || inheritedFile;

    if (Array.isArray(suite.specs)) {
      for (const spec of suite.specs) {
        const specFile = spec.file || suiteFile;
        const specTitle = spec.title || "unknown test";

        if (!Array.isArray(spec.tests)) continue;

        for (const test of spec.tests) {
          if (!Array.isArray(test.results)) continue;
          for (const result of test.results) {
            if (result.status !== "failed") continue;

            const message =
              result.error?.message ||
              (Array.isArray(result.errors) && result.errors[0]?.message) ||
              "Unknown failure";

            failures.push({
              file: specFile || "unknown",
              title: specTitle,
              workerIndex: result.workerIndex ?? null,
              retry: result.retry ?? 0,
              durationMs: result.duration ?? null,
              error: message.trim(),
              stack: result.error?.stack || null,
            });
          }
        }
      }
    }

    if (Array.isArray(suite.suites)) {
      for (const child of suite.suites) {
        traverseSuite(child, suiteFile);
      }
    }
  }

  if (Array.isArray(report.suites)) {
    for (const suite of report.suites) {
      traverseSuite(suite, suite.file);
    }
  }

  return failures;
}

function categorizeFailure(message = "") {
  const text = message.toLowerCase();
  if (/timeout/.test(text)) return "Timing/Performance";
  if (/selector/.test(text)) return "UI Selector";
  if (/network/.test(text) || /fetch/.test(text) || /500/.test(text))
    return "Network/API";
  if (/assert/.test(text) || /expect/.test(text)) return "Assertion/Logic";
  return "Unclassified";
}

function recommendedStrategy(category, title) {
  const grepArg = title.replace(/"/g, '\\"');
  switch (category) {
    case "Timing/Performance":
      return `PW_HEADLESS=1 npx playwright test --project=chromium --timeout=180000 --grep "${grepArg}"`;
    case "UI Selector":
      return `PW_HEADLESS=1 npx playwright test --project=chromium --debug --grep "${grepArg}"`;
    case "Network/API":
      return `PW_HEADLESS=1 npx playwright test --project=chromium --grep "${grepArg}" --retries=1`;
    case "Assertion/Logic":
      return `PW_HEADLESS=1 npx playwright test --project=chromium --grep "${grepArg}"`;
    default:
      return "Review manually before rerun.";
  }
}

function buildSummaries(failures) {
  const categories = {};
  for (const failure of failures) {
    const category = categorizeFailure(failure.error);
    failure.category = category;
    failure.retest = recommendedStrategy(category, failure.title);
    categories[category] = (categories[category] || 0) + 1;
  }
  return categories;
}

function recommendationFromCategories(categories) {
  if (!categories || Object.keys(categories).length === 0) {
    return "No failures detected.";
  }
  const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  const [topCategory, topCount] = sorted[0];
  return `Focus on ${topCategory} issues first (${topCount} failing spec${
    topCount === 1 ? "" : "s"
  }).`;
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
  log(`Wrote ${filePath}`);
}

function updateMeta(summary) {
  if (!fs.existsSync(META_PATH)) {
    log("⚠️  meta.json not found; skipping pass-rate update.");
    return;
  }
  const meta = JSON.parse(fs.readFileSync(META_PATH, "utf8"));
  const expected = Number(meta.totals?.expected ?? 0);
  const unexpected = summary.totalFailures;

  if (expected > 0) {
    meta.totals = meta.totals || {};
    meta.totals.unexpected = unexpected;
    meta.passRate = ((expected - unexpected) / expected) * 100;
    meta.status = unexpected === 0 ? "passed" : "failed";
    meta.generatedAt = new Date().toISOString();
    writeJson(META_PATH, meta);
  } else {
    log("⚠️  meta.json expected total is zero; skipping pass-rate update.");
  }
}

function main() {
  const report = loadLatestReport();
  const failures = extractFailures(report);
  const categories = buildSummaries(failures);

  writeJson(FAILURES_PATH, { failures });

  const summary = {
    generatedAt: new Date().toISOString(),
    totalFailures: failures.length,
    categories,
    recommendation: recommendationFromCategories(categories),
  };

  writeJson(TRIAGE_SUMMARY_PATH, summary);
  updateMeta(summary);

  log(`Processed ${failures.length} failures.`);
}

try {
  main();
} catch (error) {
  log(`⚠️  ${error.message}`);
  process.exit(1);
}

