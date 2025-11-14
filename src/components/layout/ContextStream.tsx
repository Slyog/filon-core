You are in FIX MODE for ReactFlow + Next.js 16.

Goal:
Move the viewport-centering useEffect OUT of FlowCanvas and INTO CanvasRoot
to prevent ReactFlow internal useEffect ordering mismatch.

Rules:
- Do NOT modify any ReactFlow props.
- Do NOT touch nodeTypes, edges, stores.
- Do NOT add dependencies to the effect.
- It must run ONLY once after mount.

──────────────────────────
FILE: src/components/canvas/FlowCanvas.tsx
──────────────────────────
1) REMOVE the entire useEffect block that calls setViewport.
2) KEEP everything else unchanged.

──────────────────────────
FILE: src/components/canvas/CanvasRoot.tsx
──────────────────────────
ADD this useEffect AFTER the opening <div> wrapper:

  useEffect(() => {
    const host = document.querySelector<HTMLElement>("[data-id='canvas-host']");
    if (!host) return;

    const cx = host.clientWidth / 2;
    const cy = host.clientHeight / 2;

    const reactflow = window.__reactflow;
    if (reactflow?.setViewport) {
      reactflow.setViewport({ x: cx, y: cy, zoom: 1 }, { duration: 0 });
    }
  }, []); // must remain empty

Also in ReactFlow component inside CanvasRoot:
ADD this prop:
  onInit={(instance) => (window.__reactflow = instance)}

──────────────────────────

After patch completion:
Return ONLY unified diff + summary.
