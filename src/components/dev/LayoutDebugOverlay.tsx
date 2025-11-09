"use client";

import { useEffect, useState } from "react";

export default function LayoutDebugOverlay() {
  const [status, setStatus] = useState<string>("checking…");
  const [result, setResult] = useState<any>(null);
  const [shouldShow, setShouldShow] = useState(false);

  // Check if debug=layout is in URL (client-side only to avoid hydration issues)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setShouldShow(params.get("debug") === "layout");
  }, []);

  useEffect(() => {
    if (!shouldShow) return;

    function analyze():
      | {
          aside: { x: number; w: number; h: number; z: number };
          main: { x: number; w: number; h: number; z: number };
          verdict: "PASS" | "FAIL";
        }
      | { ok: false; reason: string } {
      const aside = document.querySelector(".layout-aside") as HTMLElement | null;
      const main = document.querySelector(".layout-main") as HTMLElement | null;
      if (!aside || !main) return { ok: false, reason: "missing elements" };

      const a = aside.getBoundingClientRect();
      const m = main.getBoundingClientRect();
      const zA = parseInt(getComputedStyle(aside).zIndex || "0", 10);
      const zM = parseInt(getComputedStyle(main).zIndex || "0", 10);
      const ok =
        a.width <= m.x + 1 &&
        m.x >= a.width - 2 &&
        zA > zM &&
        a.height >= window.innerHeight - 4;

      const details = {
        aside: { x: a.x, w: a.width, h: a.height, z: zA },
        main: { x: m.x, w: m.width, h: m.height, z: zM },
        verdict: ok ? ("PASS" as const) : ("FAIL" as const),
      };

      if (!ok) {
        console.warn("[FILON Layout Debug] Layout mismatch detected:", details);
        console.warn("Suggested fix: ensure main has ml-[sidebar-width] and z-index < sidebar");
      }
      return details;
    }

    setTimeout(() => {
      const res = analyze();
      setResult(res);
      if ("verdict" in res) {
        setStatus(res.verdict === "PASS" ? "✅ Layout OK" : "❌ Layout FAIL");
      } else {
        setStatus("❌ Layout FAIL");
      }
    }, 300);
  }, [shouldShow]);

  if (!shouldShow) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: 12,
        bottom: 12,
        zIndex: 9999,
        background: result?.verdict === "PASS" ? "rgba(0,60,0,.8)" : "rgba(60,0,0,.8)",
        border: "1px solid rgba(47,243,255,.25)",
        borderRadius: 10,
        padding: "10px 12px",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 12,
        color: "#9ff",
        boxShadow: "0 0 28px #2FF3FF22",
        pointerEvents: "none",
      }}
    >
      <b>FILON Layout Validator</b>
      <div>{status}</div>
      {result && "verdict" in result && (
        <>
          <div>Aside → w:{result.aside.w} z:{result.aside.z}</div>
          <div>Main → x:{result.main.x} z:{result.main.z}</div>
        </>
      )}
    </div>
  );
}

