// src/utils/rfDebug.ts
import type { ReactFlowInstance, Node } from 'reactflow';

type RF = ReactFlowInstance;

export function bbox(nodes: Node[]) {
  if (!nodes?.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0, w: 0, h: 0 };
  const xs = nodes.map(n => n.position?.x ?? 0);
  const ys = nodes.map(n => n.position?.y ?? 0);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

export function attachRFDebug(rf: RF, getNodes: () => Node[]) {
  // @ts-ignore
  (window).__rf = {
    rf,
    toObject: () => rf.toObject(),
    viewport: () => rf.toObject().viewport,
    nodes: () => getNodes(),
    bbox: () => bbox(getNodes()),
    // computed CSS transforms auf den ersten 5 Nodes
    transforms: () =>
      Array.from(document.querySelectorAll('.react-flow__node'))
        .slice(0, 5)
        .map((el: Element) => ({
          id: (el as HTMLElement).dataset.id,
          transform: getComputedStyle(el as HTMLElement).transform,
        })),
    // computed transform auf dem Viewport
    vpTransform: () => {
      const vp = document.querySelector('.react-flow__viewport') as HTMLElement | null;
      return vp ? getComputedStyle(vp).transform : '(no viewport el)';
    },
    dump() {
      const obj = rf.toObject();
      const bb = bbox(getNodes());
       
      console.table({
        zoom: obj.viewport.zoom.toFixed(3),
        x: obj.viewport.x.toFixed(1),
        y: obj.viewport.y.toFixed(1),
        nodes: getNodes().length,
        w: bb.w.toFixed(1),
        h: bb.h.toFixed(1),
        minX: bb.minX.toFixed(1),
        minY: bb.minY.toFixed(1),
      });
       
      console.log('transforms:', this.transforms());
       
      console.log('viewport transform:', this.vpTransform());
    },
  };
   
  console.info('RF Debug attached → window.__rf');
}
