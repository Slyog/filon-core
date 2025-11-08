"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import clsx from "clsx";

type SuiteSpec = {
  title: string;
  ok: boolean;
  outcome?: string;
};

type Suite = {
  title: string;
  specs: SuiteSpec[];
};

type QAReport = {
  file: string;
  meta: {
    commit: string;
    date: string;
    total: number;
    passed: number;
    failed: number;
  };
  status: "passed" | "failed";
  passRate: number;
  data: {
    suites?: Suite[];
  };
};

type FilterState = "all" | "passed" | "failed";

type TimelineDatum = {
  date: string;
  label: string;
  passRate: number;
  passed: number;
  failed: number;
  total: number;
};

const FILTERS: { id: FilterState; label: string }[] = [
  { id: "all", label: "All" },
  { id: "passed", label: "Passed" },
  { id: "failed", label: "Failed" },
];

function parseDateLabel(dateString: string | undefined) {
  if (!dateString) return { label: "Unknown", iso: null };
  const iso = dateString.replace(
    /T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/,
    (_, hh, mm, ss, ms) => `T${hh}:${mm}:${ss}.${ms}Z`
  );
  const date = Number.isNaN(Date.parse(iso)) ? null : new Date(iso);
  if (!date) {
    return {
      label: dateString,
      iso: null,
    };
  }

  return {
    label: date.toLocaleString(undefined, {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
    iso,
  };
}

type InsightsState = {
  avg: number;
  volatility: number;
  trend: { date: string; passRate: number }[];
} | null;

export default function QADashboard() {
  const [reports, setReports] = useState<QAReport[]>([]);
  const [filter, setFilter] = useState<FilterState>("all");
  const [selectedReport, setSelectedReport] = useState<QAReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<InsightsState>(null);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const response = await fetch("/api/qa/reports", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to load reports (${response.status})`);
        }
        const payload = await response.json();
        const records: QAReport[] = payload.reports ?? [];
        setReports(records);
        setSelectedReport((prev) => prev ?? records[0] ?? null);
      } catch (err) {
        console.error("[qa:dashboard] load error", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    void loadReports();
    const loadInsights = async () => {
      try {
        const response = await fetch("/api/qa/insights", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to load insights (${response.status})`);
        }
        const payload = await response.json();
        setInsights(payload);
      } catch (err) {
        console.error("[qa:dashboard] insights error", err);
        setInsightsError(err instanceof Error ? err.message : "Unknown error");
      }
    };
    void loadInsights();
  }, []);

  const filteredReports = useMemo(() => {
    if (filter === "all") return reports;
    return reports.filter((report) => report.status === filter);
  }, [filter, reports]);

  useEffect(() => {
    if (!filteredReports.length) {
      setSelectedReport(null);
      return;
    }
    if (
      selectedReport &&
      !filteredReports.some((report) => report.file === selectedReport.file)
    ) {
      setSelectedReport(filteredReports[0]);
    } else if (!selectedReport) {
      setSelectedReport(filteredReports[0]);
    }
  }, [filteredReports, selectedReport]);

  const timeline = useMemo<TimelineDatum[]>(() => {
    const source = filter === "all" ? reports : filteredReports;
    if (!source.length) return [];
    const byDay = new Map<
      string,
      { pass: number; total: number; failures: number }
    >();

    source.forEach((report) => {
      const day = report.meta?.date?.slice(0, 10) ?? "unknown";
      const record = byDay.get(day) ?? { pass: 0, total: 0, failures: 0 };
      record.pass += report.meta?.passed ?? 0;
      record.failures += report.meta?.failed ?? 0;
      record.total += report.meta?.total ?? 0;
      byDay.set(day, record);
    });

    return Array.from(byDay.entries())
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([day, sums]) => {
        const total = sums.total || sums.pass + sums.failures;
        const passRate = total > 0 ? Math.round((sums.pass / total) * 100) : 0;
        return {
          date: day,
          label: day,
          passRate,
          passed: sums.pass,
          failed: sums.failures,
          total,
        };
      });
  }, [reports, filteredReports, filter]);

  const selectedDetail = useMemo(() => {
    if (!selectedReport) return null;
    const { label } = parseDateLabel(selectedReport.meta?.date);
    return {
      ...selectedReport,
      parsedDate: label,
    };
  }, [selectedReport]);

  return (
    <div className="flex min-h-screen w-full flex-col gap-6 bg-[#05090d] p-8 text-neutral-100">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-cyan-200">
          FILON QA Dashboard
        </h1>
        <p className="max-w-3xl text-sm text-neutral-400">
          Monitor automation health at a glance. Use the filters to explore pass
          rates, inspect individual runs, and track trends across report
          history.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={clsx(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              filter === id
                ? "border-cyan-300 bg-cyan-300/10 text-cyan-200"
                : "border-neutral-700 bg-neutral-900/60 text-neutral-400 hover:border-cyan-300/40 hover:text-cyan-200"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="grid gap-4 rounded-2xl border border-cyan-300/20 bg-neutral-900/30 p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-cyan-100">Pass rate trend</h2>
          <span className="text-xs text-neutral-500">
            Showing {timeline.length} day{timeline.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="h-56 w-full">
          {timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline}>
                <CartesianGrid stroke="rgba(79, 213, 218, 0.15)" strokeDasharray="5 8" />
                <XAxis
                  dataKey="label"
                  stroke="#63727e"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#63727e"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#05090d",
                    border: "1px solid rgba(47,243,255,0.25)",
                    borderRadius: 12,
                    color: "#E8FFFF",
                  }}
                  formatter={(value, _name, entry) => {
                    const datum =
                      (entry && "payload" in entry
                        ? (entry.payload as TimelineDatum)
                        : null) ?? null;
                    if (typeof value !== "number" || !datum) {
                      return [`${value}`, "Pass rate"];
                    }
                    return [
                      `${value}%`,
                      `Pass rate (${datum.passed}/${datum.total})`,
                    ];
                  }}
                  labelFormatter={(value) => `Date: ${value}`}
                />
                <Line
                  type="monotone"
                  dataKey="passRate"
                  stroke="#2FF3FF"
                  strokeWidth={3}
                  dot={{ stroke: "#2FF3FF", strokeWidth: 2, r: 4, fill: "#0A121C" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-cyan-300/20 text-sm text-neutral-500">
              No QA reports yet. Run{" "}
              <code className="mx-1 rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-cyan-300">
                npm run qa:report
              </code>{" "}
              to collect data.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-cyan-300/20 bg-neutral-900/40 p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-cyan-100">
          QA Insights (last 30 runs)
        </h2>
        {insightsError && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {insightsError}
          </div>
        )}
        {!insights && !insightsError && (
          <div className="text-sm text-neutral-500">Loading insights…</div>
        )}
        {insights && (
          <>
            <p className="text-sm text-neutral-400">
              Average Pass Rate:{" "}
              <span className="text-cyan-300">{insights.avg}%</span> •
              Volatility: {insights.volatility}%
            </p>
            <div className="h-48 w-full">
              {insights.trend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={insights.trend}>
                    <CartesianGrid
                      stroke="rgba(79, 213, 218, 0.15)"
                      strokeDasharray="5 8"
                    />
                    <XAxis
                      dataKey="date"
                      stroke="#63727e"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke="#63727e"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#05090d",
                        border: "1px solid rgba(47,243,255,0.25)",
                        borderRadius: 12,
                        color: "#E8FFFF",
                      }}
                      formatter={(value: number) => [`${value}%`, "Pass rate"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="passRate"
                      stroke="#2FF3FF"
                      strokeWidth={3}
                      dot={{
                        stroke: "#2FF3FF",
                        strokeWidth: 2,
                        r: 3,
                        fill: "#0A121C",
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-cyan-300/20 text-sm text-neutral-500">
                  Not enough data yet to calculate insights.
                </div>
              )}
            </div>
          </>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section className="flex flex-col gap-4 rounded-2xl border border-cyan-300/20 bg-neutral-900/30 p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-cyan-100">Reports</h2>
            <span className="text-xs text-neutral-500">
              {filteredReports.length} result
              {filteredReports.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {loading && (
              <div className="text-sm text-neutral-500">Loading reports…</div>
            )}
            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </div>
            )}
            {!loading && filteredReports.length === 0 && !error && (
              <div className="rounded-lg border border-neutral-700/60 bg-neutral-900/60 p-4 text-sm text-neutral-500">
                No reports match the current filter.
              </div>
            )}
            {filteredReports.map((report) => {
              const parsed = parseDateLabel(report.meta?.date);
              const isSelected = selectedReport?.file === report.file;
              return (
                <button
                  key={report.file}
                  type="button"
                  onClick={() => setSelectedReport(report)}
                  className={clsx(
                    "flex flex-col gap-1 rounded-xl border px-4 py-3 text-left transition-all",
                    isSelected
                      ? "border-cyan-300/70 bg-cyan-300/10"
                      : "border-neutral-700/60 bg-neutral-900/60 hover:border-cyan-300/40 hover:bg-neutral-900"
                  )}
                >
                  <div className="flex items-center justify-between text-sm font-semibold text-neutral-100">
                    <span>{parsed.label}</span>
                    <span
                      className={clsx(
                        "rounded-full px-2 py-0.5 text-xs uppercase tracking-wide",
                        report.status === "passed"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-red-500/20 text-red-200"
                      )}
                    >
                      {report.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>Commit: {report.meta?.commit ?? "unknown"}</span>
                    <span>
                      {report.meta?.passed ?? 0} / {report.meta?.total ?? 0} tests
                    </span>
                  </div>
                  <div className="text-xs text-cyan-200">
                    Pass rate: {report.passRate}%
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-cyan-300/20 bg-neutral-900/40 p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-cyan-100">Report details</h2>
          {selectedDetail ? (
            <>
              <div className="grid gap-2 text-sm text-neutral-300">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Generated</span>
                  <span>{selectedDetail.parsedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Commit</span>
                  <span className="font-mono text-xs text-cyan-200">
                    {selectedDetail.meta.commit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Summary</span>
                  <span>
                    ✅ {selectedDetail.meta.passed} /{" "}
                    {selectedDetail.meta.total} • ❌{" "}
                    {selectedDetail.meta.failed}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Pass rate</span>
                  <span className="text-cyan-200">
                    {selectedDetail.passRate}%
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-semibold text-neutral-200">
                  Suites
                </h3>
                <div className="mt-3 space-y-4">
                  {selectedDetail.data?.suites?.length ? (
                    selectedDetail.data.suites.map((suite) => (
                      <div
                        key={suite.title}
                        className="rounded-xl border border-cyan-300/10 bg-neutral-950/40 p-4"
                      >
                        <div className="flex items-center justify-between text-sm text-neutral-100">
                          <span>📁 {suite.title}</span>
                          <span className="text-xs text-neutral-500">
                            {suite.specs?.length ?? 0} specs
                          </span>
                        </div>
                        <ul className="mt-3 space-y-1 text-xs text-neutral-300">
                          {suite.specs?.map((spec) => (
                            <li
                              key={spec.title}
                              className="flex items-center justify-between rounded-lg bg-neutral-900/60 px-3 py-2"
                            >
                              <span>
                                {spec.ok ? "✅" : "❌"} {spec.title}
                              </span>
                              {spec.outcome && (
                                <span className="text-[10px] uppercase tracking-wide text-neutral-500">
                                  {spec.outcome}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-lg border border-neutral-700/60 bg-neutral-900/60 p-3 text-xs text-neutral-500">
                      No suites recorded for this report.
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-cyan-300/20 p-8 text-sm text-neutral-500">
              Select a report to inspect its suites and specs.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

