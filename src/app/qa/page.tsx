"use client";

import latestReport from "@/../qa/reports/latest.json";
import dashboardMeta from "@/../qa/reports/meta.json";

type Suite = {
  title: string;
  specs?: Array<{
    title: string;
    ok: boolean;
    outcome?: string;
  }>;
};

type LegacyReport = {
  data?: {
    suites?: unknown;
  };
};

const reportSuites =
  (latestReport as LegacyReport).data?.suites ?? latestReport.suites;

const suites: Suite[] = Array.isArray(reportSuites)
  ? (reportSuites as Suite[])
  : [];

const stats = latestReport.stats ?? {};

type Totals = {
  expected: number;
  unexpected: number;
  skipped: number;
  flaky: number;
};

const derivedTotals: Totals = {
  expected: Number(stats.expected ?? 0),
  unexpected: Number(stats.unexpected ?? 0),
  skipped: Number(stats.skipped ?? 0),
  flaky: Number(stats.flaky ?? 0),
};

const metaTotals: Totals = {
  expected: Number(
    dashboardMeta?.totals?.expected ?? derivedTotals.expected
  ),
  unexpected: Number(
    dashboardMeta?.totals?.unexpected ?? derivedTotals.unexpected
  ),
  skipped: Number(dashboardMeta?.totals?.skipped ?? derivedTotals.skipped),
  flaky: Number(
    (dashboardMeta?.totals as Totals | undefined)?.flaky ?? derivedTotals.flaky
  ),
};

const expected = metaTotals.expected;
const unexpected = metaTotals.unexpected;
const derivedPassRate =
  expected > 0 ? ((expected - unexpected) / expected) * 100 : 0;
const rawPassRate =
  typeof dashboardMeta?.passRate === "number"
    ? dashboardMeta.passRate
    : derivedPassRate;
const passRate = Number.isFinite(rawPassRate) ? rawPassRate : 0;
const displayPassRate = Math.round(passRate);
const isPassing = dashboardMeta?.status === "passed";
const badgeColor = isPassing
  ? "bg-emerald-600/30 text-emerald-200 border-emerald-400/40"
  : "bg-rose-600/20 text-rose-200 border-rose-400/40";
const badgeIcon = isPassing ? "✅" : "⚠️";

const generatedAt = dashboardMeta?.generatedAt ?? stats.startTime ?? "N/A";
const totalPassed = Number(stats.expected ?? expected);
const totalTests =
  totalPassed + metaTotals.unexpected + metaTotals.flaky + metaTotals.skipped;

export default function QAReportPage() {
  return (
    <div className="flex min-h-screen w-full flex-col gap-6 bg-[#05090d] p-8 text-neutral-100">
      <header>
        <h1 className="text-3xl font-semibold text-cyan-200">
          FILON QA Center
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1 text-sm font-medium ${badgeColor}`}
          >
            {badgeIcon} {displayPassRate}% Pass Rate
          </span>
          <span className="text-xs uppercase tracking-widest text-neutral-500">
            Status: {dashboardMeta?.status ?? "unknown"}
          </span>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-neutral-400">
          Latest automated verification snapshot. Run{" "}
          <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-cyan-300">
            npm run qa:report
          </code>{" "}
          to refresh.
        </p>
      </header>

      <section className="grid gap-4 rounded-2xl border border-cyan-300/20 bg-neutral-900/40 p-6 shadow-lg backdrop-blur">
        <h2 className="text-lg font-semibold text-cyan-100">Summary</h2>
        <div className="grid gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-400">Generated</span>
            <span>{generatedAt}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Command</span>
            <span>{dashboardMeta?.command ?? "npm run qa:all"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Passed</span>
            <span>
              {totalPassed} / {totalTests}
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-3 rounded-2xl border border-cyan-300/10 bg-neutral-900/30 p-6">
        <h2 className="text-lg font-semibold text-cyan-100">Suites</h2>
        {suites.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No suites recorded in the latest report.
          </p>
        ) : (
          <div className="space-y-6">
            {suites.map((suite) => (
              <div key={suite.title} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-neutral-100">
                    📁 {suite.title}
                  </h3>
                  <span className="text-xs text-neutral-500">
                    {suite.specs?.length ?? 0} specs
                  </span>
                </div>
                <ul className="space-y-1 text-sm">
                  {suite.specs?.map((spec) => (
                    <li
                      key={spec.title}
                      className="flex items-center justify-between rounded-lg bg-neutral-950/50 px-3 py-2"
                    >
                      <span>
                        {spec.ok ? "✅" : "❌"} {spec.title}
                      </span>
                      {spec.outcome && (
                        <span className="text-xs uppercase tracking-wide text-neutral-500">
                          {spec.outcome}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

