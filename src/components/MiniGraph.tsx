import * as React from "react";

/**
 * Legacy MiniGraph shim for tests.
 * This is a minimal placeholder used by legacy specs.
 */
interface MiniGraphProps {
  nodes?: any[];
  edges?: any[];
  [key: string]: any;
}

const MiniGraph: React.FC<MiniGraphProps> = () => {
  return <div data-testid="mini-graph" />;
};

export default MiniGraph;

