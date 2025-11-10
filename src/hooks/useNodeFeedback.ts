import { useEffect } from "react";
import { Node, useReactFlow } from "reactflow";

export function useNodeFeedback(nodes: Node[]) {
  const { setNodes } = useReactFlow();

  useEffect(() => {
    if (!nodes?.length) return;
    const latest = nodes.at(-1);
    if (!latest) return;
    if (latest.data?.isNew) {
      return;
    }

    // Apply highlight
    setNodes((nds) =>
      nds.map((n) =>
        n.id === latest.id ? { ...n, data: { ...n.data, isNew: true } } : n,
      ),
    );

    console.info(`[FILON Feedback] Node created → ${latest.id}`);

    // Reset after 2 s
    const timer = setTimeout(() => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === latest.id ? { ...n, data: { ...n.data, isNew: false } } : n,
        ),
      );
    }, 2000);

    return () => clearTimeout(timer);
  }, [nodes, setNodes]);
}

