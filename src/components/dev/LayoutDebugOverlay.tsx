"use client";

import { useEffect, useState } from "react";

export default function LayoutDebugOverlay() {
  const [status, setStatus] = useState<"PENDING" | "PASS" | "FAIL">("PENDING");
  const [metrics, setMetrics] = useState<{ asideW: number; mainX: number; verdict: string }>({
    asideW: 0,
    mainX: 0,
    verdict: "?",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("debug") !== "layout") return;

    const analyze = () => {
      const aside = document.querySelector(".layout-aside") as HTMLElement | null;
      const main = document.querySelector(".layout-main") as HTMLElement | null;
      if (!aside || !main) return;

      const asideRect = aside.getBoundingClientRect();
      const mainRect = main.getBoundingClientRect();

      const asideW = Math.round(asideRect.width);
      const mainX = Math.round(mainRect.left);
      const zAside = Number(window.getComputedStyle(aside).zIndex) || 0;
      const zMain = Number(window.getComputedStyle(main).zIndex) || 0;

      const correctWidth = Math.abs(asideW - 240) <= 1;
      const correctX = Math.abs(mainX - 240) <= 1;
      const correctZ = zAside > zMain;

      const verdict = correctWidth && correctX && correctZ ? "PASS" : "FAIL";
      setMetrics({ asideW, mainX, verdict });
      setStatus(verdict as "PASS" | "FAIL");
    };

    const t1 = setTimeout(analyze, 200);
    const t2 = setTimeout(analyze, 1000);
    window.addEventListener("resize", analyze);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", analyze);
    };
  }, []);

  if (status === "PENDING") return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1rem",
        right: "1rem",
        background: status === "PASS" ? "#093" : "#300",
        color: "#fff",
        padding: "0.5rem 1rem",
        borderRadius: 8,
        fontSize: 12,
        fontFamily: "monospace",
        zIndex: 9999,
        boxShadow: "0 0 10px rgba(0,0,0,0.4)",
      }}
    >
      <strong>FILON Layout Validator</strong>
      <div>{status === "PASS" ? "✅ Layout OK" : "❌ Layout FAIL"}</div>
      <div>Aside → w:{metrics.asideW}</div>
      <div>Main → x:{metrics.mainX}</div>
    </div>
  );
}

