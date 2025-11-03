'use client';
import { useEffect, useState } from 'react';
import type { ReactFlowInstance, Node } from 'reactflow';

export default function RFDebugPanel({
  rf,
  nodesProvider,
}: {
  rf: ReactFlowInstance | null;
  nodesProvider: () => Node[];
}) {
  const [vp, setVp] = useState<{ x: number; y: number; zoom: number } | null>(null);
  const [counts, setCounts] = useState({ nodes: 0 });

  useEffect(() => {
    if (!rf) return;
    const update = () => {
      const obj = rf.toObject();
      setVp(obj.viewport);
      setCounts({ nodes: nodesProvider().length });
    };
    update();
    const id = setInterval(update, 500);
    return () => clearInterval(id);
  }, [rf, nodesProvider]);

  if (!rf) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 8,
        left: 8,
        zIndex: 9999,
        padding: '8px 10px',
        borderRadius: 10,
        fontSize: 12,
        fontFamily: 'monospace',
        background: 'rgba(10,15,18,0.8)',
        color: '#2ff3ff',
        boxShadow: '0 0 12px rgba(47,243,255,.25)',
        pointerEvents: 'none',
      }}
    >
      <div>VP: {vp ? `x:${vp.x.toFixed(0)} y:${vp.y.toFixed(0)} z:${vp.zoom.toFixed(2)}` : '-'}</div>
      <div>Nodes: {counts.nodes}</div>
      <div>Hint: open console → <code>__rf.dump()</code></div>
    </div>
  );
}
