"use client";

import latestReport from "@/../qa/reports/latest.json";

type Report = typeof latestReport;

const suites = Array.isArray(latestReport.data?.suites)
  ? (latestReport.data.suites as Report["data"]["suites"])
  : [];

export default function QAReportPage() {
  return (
    <div className="flex min-h-screen w-full flex-col gap-6 bg-[#05090d] p-8 text-neutral-100">
      <header>
        <h1 className="text-3xl font-semibold text-cyan-200">
          FILON QA Center
        </h1>
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
            <span>{latestReport.meta?.date ?? "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Commit</span>
            <span>{latestReport.meta?.commit ?? "local-dev"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Passed</span>
            <span>
              {latestReport.meta?.passed ?? 0} /{" "}
              {latestReport.meta?.total ?? 0}
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

