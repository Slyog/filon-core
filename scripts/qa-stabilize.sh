#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="${ROOT_DIR}/qa-output"
REPORT_DIR="${ROOT_DIR}/qa/reports"
LOG_FILE="${LOG_DIR}/headless-run.log"

mkdir -p "${LOG_DIR}" "${REPORT_DIR}"

echo "🧩 Preparing FILON QA environment..."

export PW_HEADLESS="${PW_HEADLESS:-1}"
export NODE_ENV="${NODE_ENV:-test}"
export NPM_CONFIG_LEGACY_PEER_DEPS="${NPM_CONFIG_LEGACY_PEER_DEPS:-true}"

cd "${ROOT_DIR}"

echo "📦 Installing dependencies (legacy peer deps)..."
npm install --no-audit --no-fund --legacy-peer-deps

echo "🎭 Ensuring Playwright browsers (chromium)..."
npx playwright install chromium

echo "🚀 Running full QA sweep (npm run qa:all)..."
set +e
npm run qa:all | tee "${LOG_FILE}"
QA_EXIT=${PIPESTATUS[0]}
set -e

if [[ ${QA_EXIT} -ne 0 ]]; then
  echo "⚠️  Initial QA run failed. Retrying only failed specs..."
  set +e
  PW_HEADLESS=1 npx playwright test --last-failed --reporter=list
  RETRY_EXIT=$?
  set -e
  if [[ ${RETRY_EXIT} -ne 0 ]]; then
    echo "❌ Replay of failed specs did not pass cleanly (exit ${RETRY_EXIT})."
  else
    echo "✅ Replay of failed specs succeeded."
  fi
else
  echo "✅ Initial QA sweep succeeded."
fi

echo "🧠 Validating QA JSON reports..."
for json in "${LOG_DIR}"/*.json "${REPORT_DIR}"/*.json; do
  [[ -f "${json}" ]] || continue
  if jq empty "${json}" >/dev/null 2>&1; then
    echo "  ✅ ${json} valid JSON"
  else
    echo "  ⚠️  ${json} invalid JSON — attempting auto-fix"
    sed -i 's/[^[:print:]]//g' "${json}"
    if jq . "${json}" >"${json}.tmp" 2>/dev/null; then
      mv "${json}.tmp" "${json}"
      echo "  🩹  repaired ${json}"
    else
      rm -f "${json}.tmp"
      echo "  ❌ could not repair ${json}"
    fi
  fi
done

echo "📊 Ensuring meta fields in QA JSON reports..."
for json in "${LOG_DIR}"/*.json "${REPORT_DIR}"/*.json; do
  [[ -f "${json}" ]] || continue
  if jq -e '.step and .agent and .status and .duration' "${json}" >/dev/null 2>&1; then
    echo "  ✅ meta fields present in ${json}"
  else
    echo "  ⚠️  meta fields missing in ${json}, patching..."
    jq '. + { step: (.step // "unknown"), agent: (.agent // "Cursor"), status: (.status // "unknown"), duration: (.duration // 0) }' "${json}" >"${json}.tmp"
    mv "${json}.tmp" "${json}"
    echo "  🩹  patched meta fields in ${json}"
  fi
done

LATEST_JSON="${REPORT_DIR}/latest.json"
META_JSON="${REPORT_DIR}/meta.json"
if [[ -f "${LATEST_JSON}" ]]; then
  if jq -e '.stats' "${LATEST_JSON}" >/dev/null 2>&1; then
    jq '{
      generatedAt: (now | strftime("%Y-%m-%dT%H:%M:%SZ")),
      status: (if (.stats.unexpected // 0) == 0 then "passed" else "failed" end),
      durationMs: (.stats.duration // 0),
      totals: {
        expected: (.stats.expected // 0),
        unexpected: (.stats.unexpected // 0),
        skipped: (.stats.skipped // 0)
      },
      passRate: (if (.stats.expected // 0) == 0 then 100 else (((.stats.expected - (.stats.unexpected // 0)) / (.stats.expected)) * 100) end),
      command: "npm run qa:all"
    }' "${LATEST_JSON}" >"${META_JSON}.tmp" && mv "${META_JSON}.tmp" "${META_JSON}"
    echo "🗂️  Wrote meta summary to ${META_JSON}"
  else
    echo "⚠️  Unable to derive meta summary — missing stats in ${LATEST_JSON}"
  fi
fi

FINAL_EXIT=${QA_EXIT}
if [[ ${FINAL_EXIT} -ne 0 ]]; then
  echo "🚨 QA sweep completed with failures. See ${LOG_FILE} and Playwright traces under test-results/."
else
  echo "✅ QA sweep completed successfully."
fi

exit ${FINAL_EXIT}

